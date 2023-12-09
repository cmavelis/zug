import { Client } from 'boardgame.io/client';
import { Local, SocketIO } from 'boardgame.io/multiplayer';
import { type GameState, SimulChess } from './Game';
import type { _ClientImpl } from 'boardgame.io/dist/types/src/client/client';
import { getServerURL } from '@/utils';

const server = getServerURL();

export class SimulChessClient {
  client: _ClientImpl<any, { G: GameState; playerID: number | null }>;
  constructor(
    playerID: string | null,
    matchID?: string,
    credentials?: string,
    local?: boolean,
  ) {
    this.client = Client({
      game: SimulChess,
      multiplayer: local
        ? Local()
        : SocketIO({
            server,
          }),
      // @ts-expect-error [TS-2322]
      playerID,
      matchID,
      debug: false,
      credentials,
    });
    this.client.start();
  }
}
