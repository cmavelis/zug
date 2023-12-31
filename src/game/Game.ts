import type { Game } from 'boardgame.io';
import { INVALID_MOVE } from 'boardgame.io/core';
import { shuffle } from 'lodash';

import { createPiece, type Piece } from '@/game/pieces';
import type { Order, Orders } from '@/game/orders';
import { orderResolver } from '@/game/orders';
import type { Coordinates } from '@/game/common';
import { isValidOrder } from '@/game/zugzwang/validators';
import type { ZugConfig as CommonGameConfig } from '@/game/zugzwang/config';
import { stripSecrets } from '@/game/common';
import { DEFAULT_ZUG_CONFIG } from '@/game/zugzwang/config';

export interface GameSetupData {
  config: Partial<CommonGameConfig>;
  empty?: boolean;
}

export interface GameState {
  config: CommonGameConfig & {
    board: Coordinates;
  };
  cells: Array<null | number>;
  orders: { [playerID: number]: Orders };
  pieces: Piece[];
  score: { [playerID: number]: number };
  events?: GameEvent[];
}

export interface GameEvent {
  type: 'score' | 'destroy';
  sourcePieceId: number;
}

export type GameStateHistory = Omit<GameState, 'config'>;

export type GObject = {
  history: Omit<GameState, 'config'>[][];
} & GameState;

let hostname: any;
let port: any;
let empty = false;
if (typeof window !== 'undefined' && window?.location) {
  hostname = window.location.hostname;
  port = window.location.port;

  const queryString = window.location.search; // Returns:'?q=123'
  const params = new URLSearchParams(queryString);
  empty = Boolean(params.get('empty'));
}

export const SimulChess: Game<GObject> = {
  name: 'zug',
  setup: (_, setupData: GameSetupData) => {
    const board = { x: 4, y: 4 };
    const initialGame = {
      config: {
        board,
        ...DEFAULT_ZUG_CONFIG,
        ...setupData.config,
      },
      cells: Array(board.x * board.y).fill(null),
      pieces: [],
      orders: { 0: [], 1: [] },
      history: [],
      score: { 0: 0, 1: 0 },
    };

    if (setupData?.empty || empty) {
      return initialGame;
    }
    if (hostname === 'localhost' && port === '5173') {
      [0, 1, 2].forEach((x) =>
        createPiece({
          G: initialGame,
          pieceToCreate: { owner: 0, position: { x, y: 0 } },
        }),
      );

      [0, 1, 2].forEach((x) =>
        createPiece({
          G: initialGame,
          pieceToCreate: { owner: 1, position: { x, y: 2 } },
        }),
      );
      createPiece({
        G: initialGame,
        pieceToCreate: { owner: 1, position: { x: 3, y: 3 } },
      });
    } else {
      const { startingPiecePriorities } = setupData.config;
      const p1PiecePriorities = shuffle(startingPiecePriorities);
      const p2PiecePriorities = shuffle(startingPiecePriorities);

      [0, 1, 2, 3].forEach((x, i) =>
        createPiece({
          G: initialGame,
          pieceToCreate: { owner: 0, position: { x, y: 0 } },
          forcedPriority: p1PiecePriorities[i],
        }),
      );

      [0, 1, 2, 3].forEach((x, i) =>
        createPiece({
          G: initialGame,
          pieceToCreate: { owner: 1, position: { x, y: 3 } },
          forcedPriority: p2PiecePriorities[i],
        }),
      );
    }

    return initialGame;
  },

  // `playerID` could also be null or undefined for spectators.
  playerView: ({ G, playerID }) => {
    return stripSecrets(G, playerID);
  },

  turn: {
    onBegin: ({ events }) => {
      events.setActivePlayers({
        all: 'planning',
      });
    },
    stages: {
      planning: {
        moves: {
          addOrder: {
            move: (
              { G, playerID }: { G: GameState; playerID: string },
              order: Order,
            ) => {
              const playerNumber = +playerID;
              if (order.sourcePieceId >= 0) {
                // negative values don't reference a real source piece
                const movedPiece = G.pieces.find(
                  (p) => p.id === order.sourcePieceId,
                );

                // only order your pieces
                if (movedPiece?.owner !== playerNumber) {
                  return INVALID_MOVE;
                }

                // one order per piece
                if (
                  G.orders[playerNumber].find(
                    (currentOrders) =>
                      currentOrders.sourcePieceId === order.sourcePieceId,
                  )
                ) {
                  return INVALID_MOVE;
                }

                // validate type/direction
                if (!isValidOrder(movedPiece.owner, order)) {
                  return INVALID_MOVE;
                }
              }

              G.orders[playerNumber].push(order);
            },
            // Prevents the move counting towards a player’s number of moves.
            noLimit: true,
          },
          removeLastOrder: {
            move: ({ G, playerID }: { G: GameState; playerID: string }) => {
              const playerNumber = +playerID;
              G.orders[playerNumber].pop();
            },
            noLimit: true,
          },
          removeOrder: {
            move: ({ G }: { G: GameState }, pieceID: number) => {
              for (const i of [0, 1]) {
                if (!G.orders[i]) return;
                G.orders[i] = G.orders[i].filter(
                  (order) => order.sourcePieceId !== pieceID,
                );
              }
            },
            noLimit: true,
          },
        },
        next: 'resolution',
      },
      resolution: {
        next: 'resolution',
      },
    },
    endIf: ({ ctx }) => {
      if (ctx.activePlayers)
        return Object.values(ctx.activePlayers).every(
          (p) => p === 'resolution',
        );
    },
    onEnd: ({ G }) => {
      try {
        return orderResolver({ G });
      } catch (e) {
        console.error(e);
      }
    },
  },

  moves: {},

  endIf: ({ G }) => {
    const gameTo = 4;
    if (G.score[0] >= gameTo) {
      return { winner: 0 };
    }
    if (G.score[1] >= gameTo) {
      return { winner: 1 };
    }
  },
};
