/** for zugzwang game
 */
import type { Piece } from '@/game/pieces';
import type {
  AttackOrder,
  MoveDiagonalOrder,
  MoveStraightOrder,
  Order,
  OrderTypes,
} from '@/game/orders';
import type { Coordinates } from '@/game/common';

export function isDiagonal(vector: Coordinates): boolean {
  const xChangesAllowed = [-1, 1];
  const yChangesAllowed = [-1, 1];

  return (
    xChangesAllowed.includes(vector.x) && yChangesAllowed.includes(vector.y)
  );
}

export function isStraight(vector: Coordinates): boolean {
  if (Math.abs(vector.x) > 0) {
    return vector.y === 0;
  }
  if (Math.abs(vector.y) > 0) {
    return vector.x === 0;
  }
  return false;
}

interface MoveConfig {
  angle: 'straight' | 'diagonal';
  xAllowed: Number[];
  yAllowed: Number[]; // remember to invert this for player 2
}

type ConfigOrderType = Exclude<OrderTypes, 'defend'>;

const ORDER_CONFIG: {
  [T in ConfigOrderType]: MoveConfig;
} = {
  attack: {
    angle: 'diagonal',
    xAllowed: [1, -1],
    yAllowed: [1],
  },
  'move-straight': {
    angle: 'straight',
    xAllowed: [0],
    yAllowed: [1],
  },
  'move-diagonal': {
    angle: 'diagonal',
    xAllowed: [1, -1],
    yAllowed: [1, -1],
  },
  'push-straight': {
    angle: 'straight',
    xAllowed: [1, 0, -1],
    yAllowed: [1, 0, -1],
  },
  'push-diagonal': {
    angle: 'diagonal',
    xAllowed: [1, -1],
    yAllowed: [1, -1],
  },
  place: {}, // todo allow area of board
};

export function isValidOrder(piece: Piece, order: Order): boolean {
  const config = ORDER_CONFIG[order.type as ConfigOrderType];
  const { angle, xAllowed, yAllowed } = config;

  if (order.type === 'defend') {
    return false;
  }

  const yRelative = order.toTarget.y;
  const yChange = piece.owner === 0 ? yRelative : -yRelative;

  const xChange = order.toTarget.x;

  let angleValid = true;
  if (angle === 'straight') {
    angleValid = isStraight(order.toTarget);
  }
  if (angle === 'diagonal') {
    angleValid = isDiagonal(order.toTarget);
  }

  const xValid = xAllowed.some((i) => i === xChange);
  const yValid = yAllowed.some((i) => i === yChange);

  return xValid && yValid && angleValid;
}

export function isValidMoveDiagonal(
  piece: Piece,
  move: MoveDiagonalOrder
): boolean {
  return isDiagonal(move.toTarget);
}

export function isValidMoveStraight(
  piece: Piece,
  move: MoveStraightOrder
): boolean {
  // assume moves can only go one direction
  const yChangeAllowed = piece.owner === 0 ? 1 : -1;
  const xChangeAllowed = 0;

  const yChange = move.toTarget.y;
  const xChange = move.toTarget.x;

  return yChange === yChangeAllowed && xChange === xChangeAllowed;
}
