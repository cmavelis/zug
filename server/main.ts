// @ts-nocheck
// @ts-ignore
import 'dotenv/config';
import { PostgresStore } from 'bgio-postgres';
import { DataTypes } from 'sequelize';
import { randomUUID } from 'crypto';

import { decodeToken, encodeToken } from './auth';
import { ZugUser } from '../src/utils/auth';

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
const db = new PostgresStore(process.env.DATABASE_URL);

const getDiscordTokenExchangeURI = (origin: string) => {
  return origin + '/api/exchange/discord';
};

interface ITempUser {
  name: string;
  credentials: string;
}

interface IUser {
  name: string;
  credentials: string;
  discord?: any;
}

const TempUser = sequelize.define('TempUser', {
  name: { type: DataTypes.TEXT, allowNull: false },
  credentials: { type: DataTypes.UUID, allowNull: false },
});
TempUser.sync().catch(console.error);

const User = sequelize.define('User', {
  name: { type: DataTypes.TEXT, allowNull: false },
  credentials: { type: DataTypes.UUID, allowNull: false },
  discord: DataTypes.JSON,
});
User.sync().catch(console.error);

interface ZugToken extends ZugUser {
  iat: number; // 'instantiated at'
  credentials: string;
}

const generateCredentials = async (ctx) => {
  console.log('request', ctx.request.headers);
  const authHeader = ctx.request.headers['authorization'];
  if (authHeader === 'open') {
    return 'open';
  }

  const token: ZugToken = decodeToken(authHeader);
  return token.credentials;
};

const authenticateCredentials = async (credentials, playerMetadata) => {
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

server.router.post('/api/login', koaBody(), async (ctx) => {
  const { request } = ctx;
  const { username } = request.body;

  const existingUser: ITempUser = await TempUser.findOne({
    where: { name: username },
  });

  let credentials = randomUUID();
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
});

server.router.post('/api/login/discord', koaBody(), async (ctx) => {
  const { request } = ctx;
  const { username } = request.body;

  const existingUser: IUser = await User.findOne({
    where: { name: username },
  });

  let credentials = randomUUID();
  if (existingUser) {
    credentials = existingUser.credentials;
  } else {
    // oauth discord
    const origin = ctx.request.origin;
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
});

const DISCORD_API_ENDPOINT = 'https://discord.com/api/v10';
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;

// discord: exchange code for OAuth credentials
server.router.get('/api/exchange/discord', async (ctx) => {
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
  console.log('RESPONSE', resp.data);
  // TODO: save tokens in DB
  // data: {access_token, refresh_token}
  const Authorization = 'Bearer ' + resp.data['access_token'];

  const user = await axios
    .get(DISCORD_API_ENDPOINT + '/users/@me', {
      headers: { Authorization },
    })
    .catch(console.error);

  await botClient.users.send(user.data.id, 'we logged ya in');
  ctx.redirect(origin); // TODO: redirect to my page that finishes the login
});

server.run(Number(process.env.PORT) || 8000, () => {
  server.app.use(
    async (ctx, next) =>
      await serve(frontEndAppBuildPath)(
        Object.assign(ctx, { path: 'index.html' }),
        next,
      ),
  );
});

// discord auth link (redirect needs changed)
// https://discord.com/oauth2/authorize?response_type=code&client_id=1170904526635675678&scope=identify&state=15773059ghq9183habn&redirect_uri=https%3A%2F%2Fcameronavelis.com&prompt=consent

// http%3A%2F%2Flocalhost%3A8000%2Fexchange
// https://discord.com/oauth2/authorize?response_type=code&client_id=1170904526635675678&scope=identify&state=15773059ghq9183habn&redirect_uri=http%3A%2F%2Flocalhost%3A8000%2Fexchange&prompt=consent

// redirected to:
// https://www.cameronavelis.com/?code=bohiSWTBGHFpgrmqCY9VPaqAh13myS&state=15773059ghq9183habn

// railway (how they do it, for notes) (didn't work)
// https://discord.com/oauth2/authorize?client_id=743821730639773696&redirect_uri=https%3A%2F%2Frailway.app%2Fauth%2Fdiscord&response_type=code&scope=identify%20email%20connections%20guilds%20guilds.join&state=cGFnZT1wcm9maWxlJmNvbm5lY3Q9Y21hdmVsaXMlNDBnbWFpbC5jb20mbm9uY2U9ZjY3ZTI1YjgtOGJmZS00ZGUxLWFhMDgtNDg0NzU3ZWNjMjdj
