import { test, expect } from 'vitest';
import {
  getValidSquaresForOrder,
  isValidOrder,
} from '@/game/zugzwang/validators';
import type { Piece } from '@/game/pieces';
import type { AttackOrder, PushStraightOrder } from '@/game/orders';

const testPiece: Piece = {
  id: 0,
  position: { x: 2, y: 1 },
  owner: 1,
  isDefending: false,
  priority: 0,
};

const testPiece2: Piece = {
  id: 1,
  position: { x: 2, y: 1 },
  owner: 0,
  isDefending: false,
  priority: 0,
};

const testAttack1: AttackOrder = {
  sourcePieceId: 0,
  toTarget: { x: 1, y: -1 },
  type: 'attack',
  owner: 0,
  priority: 1,
};

const testPushS1: PushStraightOrder = {
  sourcePieceId: 0,
  toTarget: { x: 1, y: 0 },
  type: 'push-straight',
  owner: 0,
  priority: 1,
};

const testPushS2: PushStraightOrder = {
  sourcePieceId: 0,
  toTarget: { x: 1, y: 1 },
  type: 'push-straight',
  owner: 0,
  priority: 1,
};

test('attackValidator valid', () => {
  expect(isValidOrder(testPiece, testAttack1)).toEqual(true);
});

test('attackValidator invalid', () => {
  expect(isValidOrder(testPiece2, testAttack1)).toEqual(false);
});

test('push straight valid', () => {
  expect(isValidOrder(testPiece, testPushS1)).toEqual(true);
});

test('push straight invalid', () => {
  expect(isValidOrder(testPiece, testPushS2)).toEqual(false);
});

test('getSquares for place order', () => {
  expect(
    getValidSquaresForOrder({
      playerID: 0,
      board: {
        x: 4,
        y: 4,
      },
      orderType: 'place',
    }),
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
      orderType: 'place',
    }),
  ).toEqual([
    { x: 0, y: 3 },
    { x: 1, y: 3 },
    { x: 2, y: 3 },
    { x: 3, y: 3 },
  ]);
});

test('getSquares for move-diagonal order, player 1', () => {
  expect(
    getValidSquaresForOrder({
      origin: { x: 2, y: 2 },
      playerID: 0,
      board: {
        x: 4,
        y: 4,
      },
      orderType: 'move-diagonal',
    }),
  ).toEqual(
    expect.arrayContaining([
      { x: 1, y: 3 },
      { x: 3, y: 3 },
    ]),
  );
});

test('getSquares for move-diagonal order, player 2', () => {
  expect(
    getValidSquaresForOrder({
      origin: { x: 2, y: 2 },
      playerID: 1,
      board: {
        x: 4,
        y: 4,
      },
      orderType: 'move-diagonal',
    }),
  ).toEqual(
    expect.arrayContaining([
      { x: 1, y: 1 },
      { x: 3, y: 1 },
    ]),
  );
});

test('getSquares for push-straight order, player 1', () => {
  expect(
    getValidSquaresForOrder({
      origin: { x: 2, y: 2 },
      playerID: 0,
      board: {
        x: 4,
        y: 4,
      },
      orderType: 'push-straight',
    }),
  ).toEqual(
    expect.arrayContaining([
      { x: 2, y: 1 },
      { x: 2, y: 3 },
      { x: 1, y: 2 },
      { x: 3, y: 2 },
    ]),
  );

  expect(
    getValidSquaresForOrder({
      origin: { x: 2, y: 2 },
      playerID: 0,
      board: {
        x: 4,
        y: 4,
      },
      orderType: 'push-straight',
    }),
  ).toEqual(
    expect.not.arrayContaining([
      { x: 3, y: 3 },
      { x: 1, y: 1 },
    ]),
  );
});
