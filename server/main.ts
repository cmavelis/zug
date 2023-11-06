// @ts-nocheck
// @ts-ignore
const { Server, Origins } = require('boardgame.io/server');
const { SimulChess } = require('../src/game/Game');
const path = require('path');
const serve = require('koa-static');
const jwt = require('jsonwebtoken');

import { PostgresStore } from 'bgio-postgres';

const dbname = 'zug-test';
const username = 'cmavelis';

// // EITHER provide a URI
// const db = new PostgresStore(
//   'postgresql://<username>:<password>@<host>/<database>',
// );

// OR provide options
const db = new PostgresStore({
  database: dbname,
  username,
});

const decodeToken = (token: string) => {
  try {
    const decoded = jwt.verify(token, 'secret'); // TODO: real secret
    // `sub` is just from the jwt example
    return decoded.sub;
  } catch (e) {
    console.error("Couldn't decode token", e);
    return 'error';
  }
};
const generateCredentials = async (ctx) => {
  console.log('request', ctx.request.headers);
  const authHeader = ctx.request.headers['authorization'];
  return decodeToken(authHeader);
};

const authenticateCredentials = async (credentials, playerMetadata) => {
  console.log('authenticateCredentials');
  console.log(credentials, playerMetadata);
  if (credentials) {
    const token = decodeToken(credentials);
    if (token === playerMetadata?.credentials) return true;
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

server.run(Number(process.env.PORT) || 8000, () => {
  server.app.use(
    async (ctx, next) =>
      await serve(frontEndAppBuildPath)(
        Object.assign(ctx, { path: 'index.html' }),
        next,
      ),
  );
});
