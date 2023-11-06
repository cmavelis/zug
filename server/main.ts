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

server.router.get('/exchange', async (ctx) => {
  const { request } = ctx;
  console.log(request?.query?.code);
  // do discord oauth https://discord.com/developers/docs/topics/oauth2#authorization-code-grant-access-token-exchange-example
  ctx.redirect('/discord');
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
