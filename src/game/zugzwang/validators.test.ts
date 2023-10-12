import { test, expect } from 'vitest';
import {
  getValidSquaresForOrder,
  isValidOrder,
} from '@/game/zugzwang/validators';
import type { Piece } from '@/game/pieces';
import type { AttackOrder } from '@/game/orders';

const testPiece: Piece = {
  id: 0,
  position: { x: 2, y: 1 },
  owner: 1,
  isDefending: false,
};

const testPiece2: Piece = {
  id: 1,
  position: { x: 2, y: 1 },
  owner: 0,
  isDefending: false,
};

const testAttack1: AttackOrder = {
  sourcePieceId: 0,
  toTarget: { x: 1, y: -1 },
  type: 'attack',
  owner: 0,
  priority: 1,
};

test('attackValidator valid', () => {
  expect(isValidOrder(testPiece, testAttack1)).toEqual(true);
});

test('attackValidator invalid', () => {
  expect(isValidOrder(testPiece2, testAttack1)).toEqual(false);
});

test('getSquares for place order', () => {
  expect(
    getValidSquaresForOrder({
      playerID: 0,
      board: {
        x: 4,
        y: 4,
      },
    })
  ).toEqual([
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 2, y: 0 },
    { x: 3, y: 0 },
  ]);
});

test('getSquares for place order, player 2', () => {
  expect(
    getValidSquaresForOrder({
      playerID: 1,
      board: {
        x: 4,
        y: 4,
      },
    })
  ).toEqual([
    { x: 0, y: 3 },
    { x: 1, y: 3 },
    { x: 2, y: 3 },
    { x: 3, y: 3 },
  ]);
});
