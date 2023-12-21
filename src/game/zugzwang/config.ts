export const PRIORITIES_LIST = [1, 2, 3, 4, 5, 6];
export const MOVES_CAN_PUSH = false;

export type PriorityMode =
  | 'choice' // the original; orders get priority based on when they were assigned in the turn
  | 'piece'; // pieces have their own priorities based on their ID, instead of order

export const PRIORITY_MODES = {
  piece: 'piece',
  choice: 'choice',
};

export type OutOfBoundsMode =
  | 'immediate' // pieces will be removed from play immediately after being knocked out of bounds
  | 'turn-end'; // pieces removed from play if OB at end of turn
