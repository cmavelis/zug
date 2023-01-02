const { Server, Origins } = require('boardgame.io/server');
const { SimulChess } = require('../src/game/Game');

const server = Server({
  games: [SimulChess],
  origins: [Origins.LOCALHOST],
});

server.run(8000);
