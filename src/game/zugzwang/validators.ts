/** for zugzwang game
 */
import type { Piece } from '@/game/pieces';
import type {
  MoveDiagonalOrder,
  MoveStraightOrder,
  Order,
  OrderTypes,
  PlaceOrder,
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
  angle: 'straight' | 'diagonal' | 'area'; // rename "shape?"
  xAllowed?: number[];
  yAllowed?: number[]; // remember to invert this for player 2
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
  place: {
    angle: 'area',
    yAllowed: [0],
  },
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

  let xValid = true;
  let yValid = true;
  if (xAllowed) {
    xValid = xAllowed.some((i) => i === xChange);
  }
  if (yAllowed) {
    yValid = yAllowed.some((i) => i === yChange);
  }

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

export function isValidPlaceOrder(order: PlaceOrder): boolean {
  const yChangeAllowed = order.owner === 0 ? 0 : 3; // place is relative to 0, 0
  const yChange = order.toTarget.y;
  return yChange === yChangeAllowed;
}

export function getValidSquaresForOrder({
  origin,
  order,
  board,
}: {
  origin: Coordinates;
  order: PlaceOrder; // needs to be ordertype or order?
  board: Coordinates;
}) {
  const config = ORDER_CONFIG.place;
  // get valid X
  const xArray =
    config.xAllowed || Array.from({ length: board.x + 1 }, (v, i) => i);
  // get valid Y
  // todo invert y for playerID = 1
  const yArray =
    config.yAllowed || Array.from({ length: board.y + 1 }, (v, i) => i);

  const allCoords: Coordinates[] = xArray.flatMap((xVal) => {
    return yArray.map((yVal) => {
      return { x: xVal, y: yVal };
    });
  });
  return allCoords;
}
//
// export function getValidSquaresForOrder({
//   origin,
//   order,
//   board,
// }: {
//   origin: Coordinates;
//   order: PlaceOrder; // needs to be ordertype or order?
//   board: Coordinates;
// }) {
//   const xArray = Array.from({ length: board.x }, (v, i) => i);
//   const yArray = Array.from({ length: board.y }, (v, i) => i);
//   const allCoords: Coordinates[] = xArray.flatMap((xVal) => {
//     return yArray.map((yVal) => {
//       return { x: xVal, y: yVal };
//     });
//   });
//
//   return allCoords.filter((testCoord) => {
//     return isValidPlaceOrder({ order });
//   });
// }
