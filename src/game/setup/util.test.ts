import { test, expect } from 'vitest';
import { hasFirstTurnScore } from '@/game/setup/util';

test.each([
  { input: [1, 2, 3, 4], expected: true },
  { input: [4, 3, 2, 1], expected: true },
  { input: [1, 3, 2, 4], expected: true },
  { input: [2, 1, 4, 3], expected: true },
  { input: [2, 1, 3, 4], expected: false },
  { input: [1, 2, 4, 3], expected: false },
  { input: [2, 3, 4, 5], expected: true },
])('hasFirstTurnScore($input) returns $expected', ({ input, expected }) => {
  expect(hasFirstTurnScore(input)).toBe(expected);
});
