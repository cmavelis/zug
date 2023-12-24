import { type GameState } from '@/game/Game';
import { DEFAULT_ZUG_CONFIG } from '@/game/zugzwang/config';
import type { Piece } from '@/game/pieces';
import type { Order } from '@/game/orders';

export const makeTestGame = (partialG?: Partial<GameState>) => {
  const G: GameState = {
    config: {
      ...DEFAULT_ZUG_CONFIG,
      board: { x: 4, y: 4 },
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

export const makeTestOrder = (partialOrder?: Partial<Order>): Order => {
  return {
    sourcePieceId: 0,
    toTarget: { x: 0, y: 1 },
    type: 'move-straight',
    owner: 0,
    priority: 1,
    ...partialOrder,
  };
};
