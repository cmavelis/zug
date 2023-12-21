export const PRIORITIES_LIST = [1, 2, 3, 4, 5, 6];
export const MOVES_CAN_PUSH = false;

export const PRIORITY_MODES = {
  piece: 'piece', // pieces have their own priorities based on their ID
  choice: 'choice', // the original; actions get priority based on when they were assigned in the turn
};
export type PriorityMode = keyof typeof PRIORITY_MODES;

export const OUT_OF_BOUNDS_MODES = {
  immediate: 'immediate', // pieces will be removed from play immediately after being knocked out of bounds
  turnEnd: 'turnEnd', // pieces removed from play if OB at end of turn
};
export type OutOfBoundsMode = keyof typeof OUT_OF_BOUNDS_MODES;
