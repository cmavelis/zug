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

test('3,3 coords, 4,4 shape', () => {
  expect(coordinatesToArray({ x: 3, y: 3 }, { x: 4, y: 4 })).toEqual(15);
});

test('-1,4 coords, 4,4 shape', () => {
  expect(coordinatesToArray({ x: -1, y: 4 }, { x: 4, y: 4 })).not.toEqual(15);
  expect(coordinatesToArray({ x: -1, y: 4 }, { x: 4, y: 4 })).toEqual(-999);
});

test('5,5 coords, 4,4 shape', () => {
  expect(coordinatesToArray({ x: 5, y: 5 }, { x: 4, y: 4 })).not.toEqual(25);
  expect(coordinatesToArray({ x: 5, y: 5 }, { x: 4, y: 4 })).toEqual(999);
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
