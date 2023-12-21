export const PRIORITIES_LIST = [1, 2, 3, 4, 5, 6];
export const MOVES_CAN_PUSH = false;

export const PRIORITY_MODES = {
  piece: 'piece',
  actionChoice: 'actionChoice',
};
export type PriorityMode = keyof typeof PRIORITY_MODES;
export const PRIORITY_DESCRIPTIONS: { [Property in PriorityMode]: string } = {
  piece:
    'Actions occur according to the priority attached to the piece that uses it (piece 1 goes before piece 3)',
  actionChoice: 'Actions occur in the order they were chosen by the player',
};

export const OUT_OF_BOUNDS_MODES = {
  immediate: 'immediate',
  turnEnd: 'turnEnd',
};
export type OutOfBoundsMode = keyof typeof OUT_OF_BOUNDS_MODES;
export const OUT_OF_BOUNDS_DESCRIPTIONS: {
  [Property in OutOfBoundsMode]: string;
} = {
  immediate:
    'Pieces are removed from play immediately after being knocked out of bounds',
  turnEnd: 'Pieces are removed from play if out of bounds at end of turn',
};
