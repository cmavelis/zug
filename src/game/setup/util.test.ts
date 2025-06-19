import { test, expect } from 'vitest';
import {
  hasFirstTurnScore,
  getConditionalStartingBoard,
} from '@/game/setup/util';

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

test('getConditionalStartingBoard returns a board that meets the condition', () => {
  const priorityOptions = [1, 2, 3, 4];
  const condition = (board: number[]) =>
    board[0] < board[1] && board[2] < board[3];
  const board = getConditionalStartingBoard(priorityOptions, condition);
  expect(condition(board)).toBe(true);
  expect(board.sort()).toEqual(priorityOptions.sort());
});

test('getConditionalStartingBoard throws if no valid board is found', () => {
  const priorityOptions = [1, 2, 3, 4];
  const impossibleCondition = () => false;
  expect(() =>
    getConditionalStartingBoard(priorityOptions, impossibleCondition, 5),
  ).toThrow('Could not find a valid starting board within maxAttempts');
});
