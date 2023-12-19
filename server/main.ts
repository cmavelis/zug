import 'dotenv/config';
import { PostgresStore } from 'bgio-postgres';
import { DataTypes } from 'sequelize';
import { randomUUID } from 'crypto';
import * as Koa from 'koa';

import { decodeToken, encodeToken } from './auth';
import { type ZugUser } from '../src/utils/auth';
import { type EnhancedMatch } from './types';
import { type LobbyAPI } from 'boardgame.io/dist/types/src/types';

// TODO: figure out which process needs this to be commonJS syntax
const { Server, Origins } = require('boardgame.io/server');
const { SimulChess } = require('../src/game/Game');
const { botClient } = require('./discordBot');
const path = require('path');
const serve = require('koa-static');
const { koaBody } = require('koa-body');
const { Sequelize } = require('sequelize');
const axios = require('axios');

const makeMatchURL = ({ matchID }: { matchID: string }) => {
  return `${process.env.HOST_URL}/match/${matchID}`;
};

const DAY_IN_MILLISECONDS = 1000 * 60 * 60 * 24;
const POKE_TIMEOUT = DAY_IN_MILLISECONDS;

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
});
const db = new PostgresStore(process.env.DATABASE_URL as string, {
  dialect: 'postgres',
});

const Match = db.sequelize.model('Match');

// notify players when it's their turn
Match.beforeUpsert(async (created) => {
  const { id } = created;
  const oldMatch = await Match.findByPk(id);
  const oldActivePlayers = oldMatch?.state?.ctx.activePlayers;
  const newActivePlayers = created?.state?.ctx.activePlayers;

  if (!(oldActivePlayers && newActivePlayers)) {
    return;
  }

  for (const p of [0, 1]) {
    const oldPhase = oldActivePlayers[p];
    const newPhase = newActivePlayers[p];
    if (oldPhase === newPhase) {
      continue;
    }
    const player = oldMatch.players[p];
    if (!player.isConnected) {
      const otherPlayer = oldMatch.players[p === 0 ? 1 : 0];
      // send discord message
      User.findOne({ where: { name: player.name } })
        .then((user) => {
          if (!user) return;
          botClient.users
            .send(
              user.discordUser.id,
              `It's your turn against ${otherPlayer.name}: \n ${makeMatchURL({
                matchID: created.id,
              })}`,
            )

            .then(() =>
              console.debug(
                `discord message sent to ${user.discordUser.username} ${user.discordUser.id}`,
              ),
            )
            .catch(console.error);
        })
        .catch(console.error);
    }
  }
});

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
const User = sequelize.define('User', {
  name: { type: DataTypes.TEXT, allowNull: false, unique: true },
  credentials: { type: DataTypes.UUID, allowNull: false },
  discordUser: DataTypes.JSON,
  discordOauth: DataTypes.JSON,
});

const UserMatch = sequelize.define('UserMatch', {
  MatchId: {
    type: DataTypes.INTEGER,
    references: {
      model: Match,
      key: 'id',
    },
  },
  UserId: {
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: 'id',
    },
  },
  lastPoke: { type: DataTypes.DATE, allowNull: true },
});
Match.belongsToMany(User, { through: UserMatch });
User.belongsToMany(Match, { through: UserMatch });
sequelize
  .sync()
  .then(() => console.log('All models synced!'))
  .catch(console.error);

interface ZugToken extends ZugUser {
  iat: number; // 'instantiated at'
}

const generateCredentials = async (ctx: {
  request: { headers: { [x: string]: any } };
}) => {
  const authHeader = ctx.request.headers['authorization'];
  if (authHeader === 'open') {
    return 'open';
  }

  const token: ZugToken = decodeToken(authHeader);
  return token.authToken;
};

const authenticateCredentials = async (
  credentials: string,
  playerMetadata: any,
) => {
  // this allows testing matches to work
  if (playerMetadata?.credentials === 'open') {
    return true;
  }
  if (credentials) {
    const token: ZugToken = decodeToken(credentials);
    if (token?.authToken === playerMetadata?.credentials) return true;
  }
  return false;
};

//server: : { router: Router<DefaultState, Context> }
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

interface MatchContext extends Koa.Context {
  body: LobbyAPI.JoinedMatch;
}
server.router.post(
  '/games/:name/:id/join',
  async (ctx: MatchContext, next: (ctx: Koa.Context) => Promise<void>) => {
    const gameName = ctx.params.name;
    const matchID = ctx.params.id;
    if (gameName !== 'zug') {
      await next(ctx);
      return;
    }
    await next(ctx);

    const body = ctx.body;
    if (body.playerID) {
      const match = await Match.findByPk(matchID);
      const { players } = match;
      const player = players[+body.playerID];
      User.findOne({ where: { name: player.name } }).then((user) => {
        if (!user) return;
        user.addMatch(match);
      });
    }
  },
);

interface MatchesContext extends Koa.Context {
  body: {
    matches: LobbyAPI.Match[];
  };
}
server.router.get(
  '/games/:name',
  async (ctx: MatchesContext, next: (ctx: Koa.Context) => Promise<void>) => {
    const gameName = ctx.params.name;
    if (gameName !== 'zug') {
      await next(ctx);
      return;
    }
    await next(ctx);

    // this list already filtered for unlisted matches
    const matchList = ctx.body.matches as EnhancedMatch[];
    for (const match of matchList) {
      const { state } = await db.fetch(match.matchID, {
        state: true,
      });
      match.score = state.G.score;
      match.turn = state.ctx.turn;
    }

    ctx.body = { matches: matchList };
  },
);

server.router.post('/games/:name/:id/poke', koaBody(), async (ctx) => {
  const matchID = ctx.params.id;
  const playerID = ctx.request.body.playerID;
  if (typeof playerID === 'undefined' || playerID === null) {
    ctx.throw(400, 'playerID is required');
  }

  const match: Match | null = await Match.findByPk(matchID);

  if (!match) {
    ctx.throw(404, 'Match ' + matchID + ' not found');
  }

  if (!match.players[playerID]) {
    ctx.throw(404, 'Player ' + playerID + ' not found');
  }
  const playerUserName = match.players[playerID].name;
  if (!playerUserName) {
    ctx.throw(404, 'Player ' + playerID + ' not available');
  }
  const users = await match.getUsers({ where: { name: playerUserName } });
  const user = users[0];

  if (!user) {
    ctx.throw(
      404,
      'User ' + playerUserName + ' not found associated with match',
    );
  }

  const userMatch = user.UserMatch;
  if (!userMatch) {
    ctx.throw(404);
  }
  const { lastPoke } = userMatch;
  const lastPokeDate = new Date(lastPoke);
  const nowDate = new Date();

  if (!lastPoke || nowDate - lastPokeDate > POKE_TIMEOUT) {
    botClient.users
      .send(
        user.discordUser.id,
        `Your opponent is reminding you to make a move! ${makeMatchURL({
          matchID,
        })}`,
      )
      .catch(console.error);

    userMatch.lastPoke = sequelize.literal('CURRENT_TIMESTAMP');
    userMatch.save();
    ctx.status = 200;
  } else {
    ctx.body = { error: 'Cannot poke again yet' };
  }
});

server.run(Number(process.env.PORT) || 8000, () => {
  server.app.use(
    async (ctx: any, next: any) =>
      await serve(frontEndAppBuildPath)(
        Object.assign(ctx, { path: 'index.html' }),
        next,
      ),
  );
});
