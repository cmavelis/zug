import { Client } from 'boardgame.io/client';
import { Local, SocketIO } from 'boardgame.io/multiplayer';
import { type GameState, SimulChess } from './Game';
import type { _ClientImpl } from 'boardgame.io/dist/types/src/client/client';

const { protocol, hostname, port } = window.location;
const server = `${protocol}//${hostname}:${port}`;

export class SimulChessClient {
  client: _ClientImpl<any, { G: GameState; playerID: number }>;
  constructor(playerID: string, matchID?: string, credentials?: string) {
    this.client = Client({
      game: SimulChess,
      multiplayer:
        hostname === 'localhost' && port === '5173'
          ? Local()
          : SocketIO({
              server,
            }),
      playerID,
      matchID,
      debug: false,
      credentials,
    });
    this.client.start();
  }
}
