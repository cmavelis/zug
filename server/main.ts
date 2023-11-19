import 'dotenv/config';
import { PostgresStore } from 'bgio-postgres';
import { DataTypes } from 'sequelize';
import { randomUUID } from 'crypto';

import { decodeToken, encodeToken } from './auth';
import { type ZugUser } from '../src/utils/auth';

// TODO: figure out which process needs this to be commonJS syntax
const { Server, Origins } = require('boardgame.io/server');
const { SimulChess } = require('../src/game/Game');
const { botClient } = require('./discordBot');
const path = require('path');
const serve = require('koa-static');
const { koaBody } = require('koa-body');
const { Sequelize } = require('sequelize');
const axios = require('axios');

const sequelize = new Sequelize(process.env.DATABASE_URL);
const db = new PostgresStore(process.env.DATABASE_URL as string);

const getDiscordTokenExchangeURI = (origin: string) => {
  return origin + '/api/exchange/discord';
};

interface IBaseUser {
  name: string;
  credentials: string;
}

interface IUser extends IBaseUser {
  discord?: any;
}

const TempUser = sequelize.define('TempUser', {
  name: { type: DataTypes.TEXT, allowNull: false },
  credentials: { type: DataTypes.UUID, allowNull: false },
});
TempUser.sync().catch(console.error);

const User = sequelize.define('User', {
  name: { type: DataTypes.TEXT, allowNull: false, unique: true },
  credentials: { type: DataTypes.UUID, allowNull: false },
  discordUser: DataTypes.JSON,
  discordOauth: DataTypes.JSON,
});
User.sync().catch(console.error);

interface ZugToken extends ZugUser {
  iat: number; // 'instantiated at'
  credentials: string;
}

const generateCredentials = async (ctx: {
  request: { headers: { [x: string]: any } };
}) => {
  console.log('request', ctx.request.headers);
  const authHeader = ctx.request.headers['authorization'];
  if (authHeader === 'open') {
    return 'open';
  }

  const token: ZugToken = decodeToken(authHeader);
  return token.credentials;
};

const authenticateCredentials = async (
  credentials: string,
  playerMetadata: any,
) => {
  console.log('authenticateCredentials');
  console.log(credentials, playerMetadata);
  // this allows testing matches to work
  if (playerMetadata?.credentials === 'open') {
    return true;
  }
  if (credentials) {
    const token: ZugToken = decodeToken(credentials);
    if (token?.credentials === playerMetadata?.credentials) return true;
  }
  return false;
};

const server = Server({
  games: [SimulChess],
  origins: [
    Origins.LOCALHOST_IN_DEVELOPMENT,
    `https://${process.env.RAILWAY_STATIC_URL}:${process.env.PORT}`,
    `https://${process.env.RAILWAY_STATIC_URL}`,
  ],
  generateCredentials,
  authenticateCredentials,
  db,
});

// Build path relative to this file
const frontEndAppBuildPath = path.resolve(__dirname, '../dist');
server.app.use(serve(frontEndAppBuildPath));

// // can compose routes like this
// server.router.get('/hello', async (ctx, next) => {
//   console.log('yep');
//   await next(ctx);
//   ctx.body = { me: 'hiya', ...ctx.body };
// });
//
// server.router.get('/hello', async (ctx) => {
//   console.log('nope');
//   ctx.body = { you: 'no' };
// });

server.router.post(
  '/api/login',
  koaBody(),
  async (ctx: { body?: any; request?: any }) => {
    const { request } = ctx;
    const { username } = request.body;

    const existingUser: IBaseUser = await TempUser.findOne({
      where: { name: username },
    });

    let credentials: string = randomUUID();
    if (existingUser) {
      credentials = existingUser.credentials;
    } else {
      await TempUser.create({ name: username, credentials });
    }

    const tokenPayload = {
      ...request.body,
      credentials,
    };

    ctx.body = {
      authToken: encodeToken(tokenPayload),
      userID: username,
    };
  },
);

server.router.post(
  '/api/login/discord',
  koaBody(),
  async (ctx: { request: any; body?: any }) => {
    const { request } = ctx;
    const { username } = request.body;

    const existingUser: IUser = await User.findOne({
      where: { name: username },
    });

    let credentials: string = randomUUID();
    if (existingUser) {
      credentials = existingUser.credentials;
    } else {
      // oauth discord
      const origin = ctx.request.origin;
      console.info('request origin to /api/login/discord:', origin);
      const uri = getDiscordTokenExchangeURI(origin);
      const uriEncoded = encodeURIComponent(uri);
      ctx.body = {
        redirect: `https://discord.com/oauth2/authorize?response_type=code&client_id=1170904526635675678&scope=identify&state=15773059ghq9183habn&redirect_uri=${uriEncoded}&prompt=consent`,
      };
      return;
    }

    const tokenPayload = {
      ...request.body,
      credentials,
    };

    ctx.body = {
      authToken: encodeToken(tokenPayload),
      userID: username,
    };
  },
);

const DISCORD_API_ENDPOINT = 'https://discord.com/api/v10';
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;

// discord: exchange code for OAuth credentials, creating user
server.router.get(
  '/api/exchange/discord',
  async (ctx: { body?: any; redirect?: any; request?: any }) => {
    const { request } = ctx;
    const { origin } = request;
    const code = request?.query?.code;
    if (!code) {
      //redirect to error
      console.error('no code provided!');
    }
    const uri = getDiscordTokenExchangeURI(origin);
    // do discord oauth https://discord.com/developers/docs/topics/oauth2#authorization-code-grant-access-token-exchange-example
    const data = {
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: uri,
    };
    const discordURL = DISCORD_API_ENDPOINT + '/oauth2/token';
    const auth = {
      username: CLIENT_ID,
      password: CLIENT_SECRET,
    };
    const resp = await axios
      .post(discordURL, data, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        auth,
      })
      .catch(console.error);
    ctx.body = resp.data;
    const Authorization = 'Bearer ' + resp.data['access_token'];

    const discordUser = await axios
      .get(DISCORD_API_ENDPOINT + '/users/@me', {
        headers: { Authorization },
      })
      .catch(console.error);

    const newCredentials = randomUUID();

    const [zugUser, created] = await User.findOrCreate({
      where: {
        name: discordUser.data.username,
      },
      defaults: {
        credentials: newCredentials,
        discordUser: discordUser.data,
        discordOauth: resp.data,
      },
    }).catch(console.error);

    if (created) {
      botClient.users
        .send(
          discordUser.data.id,
          'Your account has been linked to Zug.  You may be asked to re-verify your account every week or so.\nThanks for playing!\n\n-Cam',
        )
        .catch(console.error);
    }

    const token = encodeToken({
      userID: discordUser.data.username,
      authToken: zugUser.credentials,
    });
    ctx.redirect(
      origin + `/login?token=${token}&username=${discordUser.data.username}`,
    );
  },
);

server.run(Number(process.env.PORT) || 8000, () => {
  server.app.use(
    async (ctx: any, next: any) =>
      await serve(frontEndAppBuildPath)(
        Object.assign(ctx, { path: 'index.html' }),
        next,
      ),
  );
});
