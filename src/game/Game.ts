import { INVALID_MOVE } from 'boardgame.io/core';
import { createPiece, type IPiece } from '@/game/pieces';

export interface IGameState {
  cells: any[];
  pieces: IPiece[];
}

export const SimulChess = {
  setup: () => {
    const initialGame = {
      cells: Array(9).fill(null),
      pieces: [],
    };

    createPiece({
      G: initialGame,
      pieceToCreate: { owner: 0, position: { x: 1, y: 1 } },
    });
    createPiece({
      G: initialGame,
      pieceToCreate: { owner: 1, position: { x: 3, y: 1 } },
    });

    return initialGame;
  },

  turn: {
    minMoves: 1,
    maxMoves: 1,
  },

  moves: {
    clickCell: (
      { G, playerID }: { G: IGameState; playerID: number },
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
