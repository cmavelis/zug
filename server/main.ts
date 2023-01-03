const { Server, Origins } = require('boardgame.io/server');
const { SimulChess } = require('../src/game/Game');

const server = Server({
  games: [SimulChess],
  origins: [Origins.LOCALHOST, `https://${process.env.RAILWAY_STATIC_URL}`],
});

server.run(process.env.SERVER_PORT || 8000);
