import { INVALID_MOVE } from 'boardgame.io/core';

interface IGameState {
  cells: [any];
  pieces: [any];
}

export const SimulChess = {
  setup: () => ({
    cells: Array(9).fill(null),
    pieces: [],
  }),

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
