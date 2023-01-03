import type { Game } from 'boardgame.io';
import { INVALID_MOVE } from 'boardgame.io/core';
import { createPiece, type Piece } from '@/game/pieces';
import type { Order, Orders } from '@/game/orders';
import { orderResolver } from '@/game/orders';
import type { Coordinates } from '@/game/common';

export interface GameState {
  board: Coordinates;
  cells: Array<null | number>;
  orders: { [playerID: number]: Orders };
  pieces: Piece[];
}

export const SimulChess: Game<GameState> = {
  setup: () => {
    const board = { x: 4, y: 3 };
    const initialGame = {
      board,
      cells: Array(board.x * board.y).fill(null),
      pieces: [],
      orders: { 0: [], 1: [] },
    };

    [0, 1, 2, 3].forEach((x) =>
      createPiece({
        G: initialGame,
        pieceToCreate: { owner: 0, position: { x, y: 0 } },
      })
    );

    [0, 1, 2, 3].forEach((x) =>
      createPiece({
        G: initialGame,
        pieceToCreate: { owner: 1, position: { x, y: 2 } },
      })
    );

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
              const movedPiece = G.pieces.find(
                (p) => p.id === order.sourcePieceId
              );
              if (movedPiece?.owner !== playerNumber) {
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
