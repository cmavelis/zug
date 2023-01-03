const { Server, Origins } = require('boardgame.io/server');
const { SimulChess } = require('../src/game/Game');
const path = require('path');
const serve = require('koa-static');

const server = Server({
  games: [SimulChess],
  origins: [
    Origins.LOCALHOST_IN_DEVELOPMENT,
    `https://${process.env.RAILWAY_STATIC_URL}:${process.env.PORT}`,
    `https://${process.env.RAILWAY_STATIC_URL}`,
  ],
});

// Build path relative to this file
const frontEndAppBuildPath = path.resolve(__dirname, '../dist');
server.app.use(serve(frontEndAppBuildPath));

server.run(Number(process.env.SERVER_PORT) || 8000, () => {
  server.app.use(
    async (ctx, next) =>
      await serve(frontEndAppBuildPath)(
        Object.assign(ctx, { path: 'index.html' }),
        next
      )
  );
});
