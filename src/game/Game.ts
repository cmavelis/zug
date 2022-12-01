import { INVALID_MOVE } from 'boardgame.io/core';
import { createPiece, type Piece } from '@/game/pieces';
import type { Order, Orders } from '@/game/orders';

export interface GameState {
  cells: any[];
  orders: { [playerID: number]: Orders };
  pieces: Piece[];
}

export const SimulChess = {
  setup: () => {
    const initialGame = {
      cells: Array(9).fill(null),
      pieces: [],
      orders: { 0: [], 1: [] },
    };

    createPiece({
      G: initialGame,
      pieceToCreate: { owner: 0, position: { x: 1, y: 1 } },
    });
    createPiece({
      G: initialGame,
      pieceToCreate: { owner: 1, position: { x: 3, y: 1 } },
    });
    createPiece({
      G: initialGame,
      pieceToCreate: { owner: 1, position: { x: 2, y: 2 } },
    });

    return initialGame;
  },

  turn: {
    // @ts-ignore-line
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
              { G, playerID }: { G: GameState; playerID: number },
              order: Order
            ) => {
              if (
                G.orders[playerID].find(
                  (currentOrders) => currentOrders.pieceID === order.pieceID
                )
              ) {
                return INVALID_MOVE;
              }
              G.orders[playerID].push(order);
            },
            // Prevents the move counting towards a player’s number of moves.
            noLimit: true,
          },
        },
      },
    },
  },

  moves: {
    clickCell: (
      { G, playerID }: { G: GameState; playerID: number },
      id: number
    ) => {
      if (G.cells[id] !== null) {
        return INVALID_MOVE;
      }
      G.cells[id] = playerID;
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
