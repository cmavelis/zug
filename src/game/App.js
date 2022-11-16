import { Client } from 'boardgame.io/client';
import { SimulChess } from './Game';

class SimulChessClient {
  constructor() {
    this.client = Client({ game: SimulChess });
    this.client.start();
  }
}

export const chessClient = new SimulChessClient();
