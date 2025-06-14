import 'dotenv/config';
import { randomUUID } from 'crypto';
import * as Koa from 'koa';

import { decodeToken, encodeToken } from './auth';
import { type ZugUser } from '../src/utils/auth';
import { type EnhancedMatch } from './types';
import { type LobbyAPI } from 'boardgame.io/dist/types/src/types';
import { db, sequelize, User, Match, dbInitialized } from './db';
import { removeOldMatches } from './db/cleanup';
import { createClerkClient } from '@clerk/backend';
import { verifyToken } from '@clerk/backend';
import { JwtPayload } from 'jsonwebtoken';
import { messageDiscordUser } from './discordBot';

// TODO: figure out which process needs this to be commonJS syntax
const { Server, Origins } = require('boardgame.io/server');
const { SimulChess } = require('../src/game/Game');
const path = require('path');
const serve = require('koa-static');
const { koaBody } = require('koa-body');
const cron = require('node-cron');

const makeMatchURL = ({ matchID }: { matchID: string }) => {
  return `${process.env.HOST_URL}/match/${matchID}`;
};

const DAY_IN_MILLISECONDS = 1000 * 60 * 60 * 24;
const POKE_TIMEOUT = DAY_IN_MILLISECONDS;

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

dbInitialized.then(() => cron.schedule('0 0 0 * * *', removeOldMatches));

const getDiscordFromClerk = async (clerkUserId: string) => {
  const clerkUser = await clerkClient.users.getUser(clerkUserId);
  const discordAccount = clerkUser.externalAccounts.find(
    (a) => a.provider === 'oauth_discord',
  );

  return discordAccount && discordAccount.externalId;
};

// notify players when it's their turn
Match.beforeUpsert(async (created) => {
  try {
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
          .then(async (user) => {
            if (!user) return;
            const discordId = await getDiscordFromClerk(user.clerkId);
            messageDiscordUser({
              id: discordId,
              message: `It's your turn against ${
                otherPlayer.name
              }: \n ${makeMatchURL({
                matchID: created.id,
              })}`,
            })
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
  } catch (err) {
    console.error(err);
  }
});

interface IBaseUser {
  name: string;
  credentials: string;
}

interface IUser extends IBaseUser {
  discord?: any;
}

interface ZugToken extends ZugUser {
  iat: number; // 'instantiated at'
}

const verifyOptions = {
  secretKey: process.env.CLERK_SECRET_KEY,
};

const findUser = async (clerkId: string) => {
  return await User.findOne({
    where: { clerkId },
  });
};

const findOrRegisterClerkUser = async (clerkJwtPayload: JwtPayload) => {
  const clerkId = clerkJwtPayload.sub;

  let user = await findUser(clerkId);

  if (!user) {
    const clerkUser = await clerkClient.users
      .getUser(clerkId)
      .catch(console.error);
    if (!clerkUser) return null;
    const { username: name } = clerkUser;
    user = await User.create({
      name,
      clerkId,
    });
    const message = `registered new user: ${name}!`;
    await messageDiscordUser({
      id: '141007914386194432', // me :)
      message,
    });
    console.log(message);
  }

  return user;
};

// Custom authentication handlers
const generateCredentials = async (ctx) => {
  // user sends clerk session token as auth header
  const authHeader = ctx.request.headers.authorization;
  const token = authHeader.replace('Bearer ', '');
  const verifiedToken = await verifyToken(token, verifyOptions);

  // TODO: check for guest account if not clerk token
  if (!verifiedToken) {
    ctx.status = 401;
    throw new Error('Invalid authentication token');
  }

  const user = await findOrRegisterClerkUser(verifiedToken);
  if (!user) {
    return false;
  }
  return user.id;
};

const authenticateCredentials = async (credentials, playerMetadata) => {
  try {
    const token = await verifyToken(credentials, verifyOptions);
    const user = await findUser(token.sub);
    return user.id === playerMetadata.credentials;
  } catch (error) {
    console.error(`Error: credentials did not authenticate:\n`, error, {
      playerMetadata,
    });
    return false;
  }
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
    const now = Date.now();
    console.debug(
      ctx.params.id,
      now - Date.now(),
      'ms: Start of games/:name request',
    );
    const gameName = ctx.params.name;
    if (gameName !== 'zug') {
      await next(ctx);
      return;
    }
    await next(ctx);
    console.debug(ctx.params.id, now - Date.now(), 'ms: awaited next(ctx)');

    // this list already filtered for unlisted matches
    const matchList = ctx.body.matches as EnhancedMatch[];
    // add additional data without changing the client library call
    for (const match of matchList) {
      const { state } = await db.fetch(match.matchID, {
        state: true,
      });
      match.score = state.G.score;
      match.turn = state.ctx.turn;
      match.activePlayers = state.ctx.activePlayers;
    }

    console.debug(ctx.params.id, now - Date.now(), 'ms: finishing');
    ctx.body = { matches: matchList };
  },
);

server.router.get(
  '/games/:name/by-user/:username',
  async (ctx: MatchesContext, next: (ctx: Koa.Context) => Promise<void>) => {
    const { name: gameName, username } = ctx.params;
    if (gameName !== 'zug') {
      await next(ctx);
      return;
    }

    const existingUser = await User.findOne({
      where: { name: username },
    });
    if (!existingUser) {
      return;
    }

    const matches = await existingUser.getMatches();
    const matchesResponse = matches.map((match) => {
      const { state, id, players } = match;
      const { activePlayers } = state?.ctx || {};

      // determine if it's their turn
      let yourTurn = null;
      if (activePlayers) {
        const playerIndex = Object.values(players).findIndex(
          (player) => player.name === username,
        );
        yourTurn = activePlayers[playerIndex] === 'planning';
      }
      return {
        id,
        activePlayers: state.ctx.activePlayers,
        yourTurn,
      };
    });

    ctx.body = { matches: matchesResponse };
  },
);

server.router.post('/games/:name/:id/poke', koaBody(), async (ctx) => {
  const matchID = ctx.params.id;
  const playerID = ctx.request.body.playerID;
  if (typeof playerID === 'undefined' || playerID === null) {
    ctx.throw(400, 'playerID is required');
  }

  const match = await Match.findByPk(matchID);

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
    const discordId = await getDiscordFromClerk(user.clerkId);
    await messageDiscordUser({
      id: discordId,
      message: `Your opponent is reminding you to make a move! ${makeMatchURL({
        matchID,
      })}`,
    });

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
