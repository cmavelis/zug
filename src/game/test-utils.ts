import { type GameState } from '@/game/Game';
import { DEFAULT_ZUG_CONFIG } from '@/game/zugzwang/config';
import type { Piece } from '@/game/pieces';

export const makeTestGame = (partialG?: Partial<GameState>) => {
  const G: GameState = {
    config: {
      ...DEFAULT_ZUG_CONFIG,
      board: { x: 3, y: 3 },
    },
    cells: [],
    pieces: [],
    orders: { 0: [], 1: [] },
    score: {},
  };
  return { ...G, ...partialG };
};

export const makeTestPiece = (partialPiece?: Partial<Piece>): Piece => {
  return {
    id: 0,
    position: { x: 0, y: 0 },
    owner: 0 as 0 | 1,
    isDefending: false,
    priority: 0,
    ...partialPiece,
  };
};
