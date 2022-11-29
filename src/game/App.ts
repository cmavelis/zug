import { Client } from 'boardgame.io/client';
import { type GameState, SimulChess } from './Game';
import type { _ClientImpl } from 'boardgame.io/dist/types/src/client/client';

class SimulChessClient {
  client: _ClientImpl<any, { G: GameState; playerID: number }>;
  constructor() {
    this.client = Client({ game: SimulChess });
    this.client.start();
  }
}

export const chessClient = new SimulChessClient();
