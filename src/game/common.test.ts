import { test, expect } from 'vitest';
import { arrayToCoordinates, coordinatesToArray } from '@/game/common';

test('0,0 coords, 3,4 shape', () => {
  expect(coordinatesToArray({ x: 0, y: 0 }, { x: 3, y: 4 })).toEqual(0);
});

test('1,1 coords, 3,4 shape', () => {
  expect(coordinatesToArray({ x: 1, y: 1 }, { x: 3, y: 4 })).toEqual(4);
});

test('2,3 coords, 3,4 shape', () => {
  expect(coordinatesToArray({ x: 2, y: 3 }, { x: 3, y: 4 })).toEqual(11);
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
