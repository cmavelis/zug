import { test, expect } from 'vitest';
import { attackValidator } from '@/game/zugzwang/validators';
import type { Piece } from '@/game/pieces';
import type { AttackOrder } from '@/game/orders';

const testPiece: Piece = {
  id: 0,
  position: { x: 2, y: 1 },
  owner: 1,
};

const testAttack1: AttackOrder = {
  sourcePieceId: 0,
  target: { x: 1, y: 0 },
  type: 'attack',
};

test('attackValidator happy path', () => {
  expect(attackValidator(testPiece, testAttack1)).toEqual(true);
});
