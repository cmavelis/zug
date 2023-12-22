import { test, expect } from 'vitest';
import {
  arrayToCoordinates,
  coordinatesToArray,
  isOppositeVector,
  stripSecrets,
} from '@/game/common';
import { makeTestGame } from '@/game/test-utils';

test('0,0 coords, 3,4 shape', () => {
  expect(coordinatesToArray({ x: 0, y: 0 }, { x: 3, y: 4 })).toEqual(0);
});

test('1,1 coords, 3,4 shape', () => {
  expect(coordinatesToArray({ x: 1, y: 1 }, { x: 3, y: 4 })).toEqual(4);
});

test('2,3 coords, 3,4 shape', () => {
  expect(coordinatesToArray({ x: 2, y: 3 }, { x: 3, y: 4 })).toEqual(11);
});

test('3,3 coords, 4,4 shape', () => {
  expect(coordinatesToArray({ x: 3, y: 3 }, { x: 4, y: 4 })).toEqual(15);
});

test('-1,4 coords, 4,4 shape', () => {
  expect(coordinatesToArray({ x: -1, y: 4 }, { x: 4, y: 4 })).not.toEqual(15);
  expect(coordinatesToArray({ x: -1, y: 4 }, { x: 4, y: 4 })).toEqual(-999);
});

// coordinates start at 0
test('4,4 coords, 4,4 shape', () => {
  expect(coordinatesToArray({ x: 4, y: 4 }, { x: 4, y: 4 })).not.toEqual(16);
  expect(coordinatesToArray({ x: 4, y: 4 }, { x: 4, y: 4 })).toEqual(999);
});

// TEST ARRAY => COORDS

test('0 index, 3,4 shape', () => {
  expect(arrayToCoordinates(0, { x: 3, y: 4 })).toEqual({ x: 0, y: 0 });
});

test('4 index, 3,4 shape', () => {
  expect(arrayToCoordinates(4, { x: 3, y: 4 })).toEqual({ x: 1, y: 1 });
});

test('11 index, 3,4 shape', () => {
  expect(arrayToCoordinates(11, { x: 3, y: 4 })).toEqual({ x: 2, y: 3 });
});

test('opposite straight vectors', () => {
  expect(isOppositeVector({ x: 1, y: 0 }, { x: -1, y: 0 })).toBe(true);
});

test('orthogonal straight vectors', () => {
  expect(isOppositeVector({ x: 1, y: 0 }, { x: 0, y: 1 })).toBe(false);
});

test('opposite diagonal vectors', () => {
  expect(isOppositeVector({ x: 1, y: 1 }, { x: -1, y: -1 })).toBe(true);
});

test('orthogonal diagonal vectors', () => {
  expect(isOppositeVector({ x: 1, y: 1 }, { x: -1, y: 1 })).toBe(false);
});

test('strip secrets, p 1', () => {
  const G = makeTestGame();
  const stripped = stripSecrets(G, '0');
  expect(stripped.orders).toEqual({ 0: [] });
});

test('strip secrets, p 2', () => {
  const G = makeTestGame();
  const stripped = stripSecrets(G, '1');
  expect(stripped.orders).toEqual({ 1: [] });
});

test('strip secrets, spectator', () => {
  const G = makeTestGame();
  const stripped = stripSecrets(G, null);
  expect(stripped.orders).toEqual({ 0: [], 1: [] });
});
