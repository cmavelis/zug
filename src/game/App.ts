import { Client } from 'boardgame.io/client';
import { SocketIO } from 'boardgame.io/multiplayer';
import { type GameState, SimulChess } from './Game';
import type { _ClientImpl } from 'boardgame.io/dist/types/src/client/client';

export class SimulChessClient {
  client: _ClientImpl<any, { G: GameState; playerID: number }>;
  constructor(playerID: string) {
    this.client = Client({
      game: SimulChess,
      multiplayer: SocketIO({
        server: `localhost:${process.env.PORT || 8000}`,
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
