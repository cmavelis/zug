import { Client } from 'boardgame.io/client';
import { SocketIO } from 'boardgame.io/multiplayer';
import { type GameState, SimulChess } from './Game';
import type { _ClientImpl } from 'boardgame.io/dist/types/src/client/client';

const SERVER_PORT = 8000;

let server = `localhost:${SERVER_PORT}`;
if (import.meta.env.VITE_SERVER_URL) {
  server = `https://${import.meta.env.VITE_SERVER_URL}:${SERVER_PORT}`;
}

export class SimulChessClient {
  client: _ClientImpl<any, { G: GameState; playerID: number }>;
  constructor(playerID: string) {
    this.client = Client({
      game: SimulChess,
      multiplayer: SocketIO({
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
