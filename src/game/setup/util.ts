import { shuffle } from 'lodash';

export const hasFirstTurnScore = (priorityList: number[]) => {
  if (priorityList[0] < priorityList[1] && priorityList[2] < priorityList[3]) {
    return true;
  }
  if (priorityList[0] > priorityList[1] && priorityList[2] > priorityList[3]) {
    return true;
  }
  return false;
};

export const getConditionalStartingBoard = (
  priorityOptions: number[],
  condition: (board: number[]) => boolean,
  maxAttempts = 1000,
) => {
  let board;
  let attempts = 0;
  while (attempts < maxAttempts) {
    board = shuffle(priorityOptions);
    if (condition(board)) {
      return board;
    }
    attempts++;
  }
  throw new Error('Could not find a valid starting board within maxAttempts');
};
