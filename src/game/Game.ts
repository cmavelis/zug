import type { Game } from 'boardgame.io';
import { INVALID_MOVE } from 'boardgame.io/core';
import { createPiece, type Piece } from '@/game/pieces';
import type { Order, Orders } from '@/game/orders';
import type { Coordinates } from '@/game/common';
import { coordinatesToArray } from '@/game/common';

export interface GameState {
  board: Coordinates;
  cells: Array<null | number>;
  orders: { [playerID: number]: Orders };
  pieces: Piece[];
}

function orderResolver({ G }: { G: GameState }) {
  const { cells, orders, pieces } = G;
  // apply orders
  if (orders[0].length > 0) {
    orders[0].forEach((order) => {
      // MOVE order
      if (order.type === 'move') {
        const newLocation = coordinatesToArray(order.moveTo, G.board);
        const oldLocation = cells.findIndex((i) => i === order.sourcePieceId);
        cells[oldLocation] = null;
        cells[newLocation] = order.sourcePieceId;
        pieces[order.sourcePieceId].position = order.moveTo;
      }
    });
    orders[0] = [];
  }
  // TODO: DRY this up
  if (orders[1].length > 0) {
    orders[1].forEach((order) => {
      // MOVE order
      if (order.type === 'move') {
        const newLocation = coordinatesToArray(order.moveTo, G.board);
        const oldLocation = cells.findIndex((i) => i === order.sourcePieceId);
        cells[oldLocation] = null;
        cells[newLocation] = order.sourcePieceId;
        pieces[order.sourcePieceId].position = order.moveTo;
      }
    });
    orders[1] = [];
  }
  return G;
}

export const SimulChess: Game<GameState> = {
  setup: () => {
    const board = { x: 3, y: 4 };
    const initialGame = {
      board,
      cells: Array(board.x * board.y).fill(null),
      pieces: [],
      orders: { 0: [], 1: [] },
    };

    createPiece({
      G: initialGame,
      pieceToCreate: { owner: 0, position: { x: 1, y: 1 } },
    });
    createPiece({
      G: initialGame,
      pieceToCreate: { owner: 1, position: { x: 2, y: 3 } },
    });
    createPiece({
      G: initialGame,
      pieceToCreate: { owner: 1, position: { x: 2, y: 2 } },
    });

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
              order: Order
            ) => {
              const playerNumber = +playerID;
              const movedPiece = G.pieces[order.sourcePieceId];
              if (movedPiece.owner !== playerNumber) {
                return INVALID_MOVE;
              }
              if (
                G.orders[playerNumber].find(
                  (currentOrders) =>
                    currentOrders.sourcePieceId === order.sourcePieceId
                )
              ) {
                return INVALID_MOVE;
              }
              G.orders[playerNumber].push(order);
            },
            // Prevents the move counting towards a player’s number of moves.
            noLimit: true,
          },
        },
        next: 'resolution',
      },
      resolution: {},
    },
    endIf: ({ ctx }) => {
      if (ctx.activePlayers)
        return Object.values(ctx.activePlayers).every(
          (p) => p === 'resolution'
        );
    },
    onEnd: ({ G }) => {
      return orderResolver({ G });
    },
  },

  moves: {
    clickCell: (
      { G, playerID }: { G: GameState; playerID: string },
      id: number
    ) => {
      if (G.cells[id] !== null) {
        return INVALID_MOVE;
      }
      G.cells[id] = +playerID;
    },
  },

  // endIf: ({ G, ctx }) => {
  //   if (IsVictory(G.cells)) {
  //     return { winner: ctx.currentPlayer };
  //   }
  //   if (IsDraw(G.cells)) {
  //     return { draw: true };
  //   }
  // },
};
