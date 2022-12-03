import { test, expect } from 'vitest';
import { coordinatesToArray } from '@/game/common';

test('0,0 coords, 3,4 array', () => {
  expect(coordinatesToArray({ x: 0, y: 0 }, { x: 3, y: 4 })).toEqual(0);
});

test('1,1 coords, 3,4 array', () => {
  expect(coordinatesToArray({ x: 1, y: 1 }, { x: 3, y: 4 })).toEqual(4);
});
