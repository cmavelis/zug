import { Client } from 'boardgame.io/client';
import { Local, SocketIO } from 'boardgame.io/multiplayer';
import { type GameState, SimulChess } from './Game';
import type { _ClientImpl } from 'boardgame.io/dist/types/src/client/client';

const { protocol, hostname, port } = window.location;
const server = `${protocol}//${hostname}:${port}`;

export class SimulChessClient {
  client: _ClientImpl<any, { G: GameState; playerID: number }>;
  constructor(playerID: string) {
    this.client = Client({
      game: SimulChess,
      multiplayer:
        hostname === 'localhost' && port === '5173'
          ? Local()
          : SocketIO({
              server,
            }),
      playerID,
    });
    this.client.start();
  }
}

const playerIDs = ['0', '1'];
const clients = playerIDs.map((playerID) => {
  return new SimulChessClient(playerID);
});

export const chessClient = clients[0];
export const chessClientTwo = clients[1];
