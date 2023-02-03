import { test, expect } from 'vitest';
import { isValidAttack } from '@/game/zugzwang/validators';
import type { Piece } from '@/game/pieces';
import type { AttackOrder } from '@/game/orders';

const testPiece: Piece = {
  id: 0,
  position: { x: 2, y: 1 },
  owner: 1,
};

const testPiece2: Piece = {
  id: 1,
  position: { x: 2, y: 1 },
  owner: 0,
};

const testAttack1: AttackOrder = {
  sourcePieceId: 0,
  toTarget: { x: 1, y: -1 },
  type: 'attack',
};

test('attackValidator valid', () => {
  expect(isValidAttack(testPiece, testAttack1)).toEqual(true);
});

test('attackValidator invalid', () => {
  expect(isValidAttack(testPiece2, testAttack1)).toEqual(false);
});
