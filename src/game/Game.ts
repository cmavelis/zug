import type { Game } from 'boardgame.io';
import { INVALID_MOVE } from 'boardgame.io/core';
import { createPiece, type Piece } from '@/game/pieces';
import type { Order, Orders } from '@/game/orders';
import { orderResolver } from '@/game/orders';
import type { Coordinates } from '@/game/common';
import { isValidOrder } from '@/game/zugzwang/validators';

export interface GameState {
  board: Coordinates;
  cells: Array<null | number>;
  orders: { [playerID: number]: Orders };
  pieces: Piece[];
  score: { [playerID: number]: number };
  events?: GameEvent[];
}

export interface GameEvent {
  type: 'score';
  sourcePieceId: number;
}

export type GObject = {
  history: Omit<GameState, 'board'>[][];
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
  setup: () => {
    const board = { x: 4, y: 4 };
    const initialGame = {
      board,
      cells: Array(board.x * board.y).fill(null),
      pieces: [],
      orders: { 0: [], 1: [] },
      history: [],
      score: { 0: 0, 1: 0 },
    };

    if (empty) {
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
      [0, 1, 2, 3].forEach((x) =>
        createPiece({
          G: initialGame,
          pieceToCreate: { owner: 0, position: { x, y: 0 } },
        }),
      );

      [0, 1, 2, 3].forEach((x) =>
        createPiece({
          G: initialGame,
          pieceToCreate: { owner: 1, position: { x, y: 3 } },
        }),
      );
    }

    return initialGame;
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
                if (!isValidOrder(movedPiece, order)) {
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
      return orderResolver({ G });
    },
  },

  moves: {
    clickCell: (
      { G, playerID }: { G: GameState; playerID: string },
      id: number,
    ) => {
      if (G.cells[id] !== null) {
        return INVALID_MOVE;
      }
      G.cells[id] = +playerID;
    },
  },

  endIf: ({ G }) => {
    if (Object.values(G.score).some((i) => i > 3)) {
      return { winner: 0 }; // TODO: actually get the right one
    }
  },
};

export interface moveAddOrder {}
