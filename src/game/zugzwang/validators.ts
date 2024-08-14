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
import { addDisplacement } from '@/game/common';
import type { GameState } from '@/game/Game';

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
  shape: 'straight' | 'diagonal' | 'area';
  xAllowed?: number[];
  yAllowed?: number[]; // remember to invert this for player 2
  absolute?: boolean;
}

export type ConfigOrderType = Exclude<OrderTypes, 'defend'>;

const ORDER_CONFIG: {
  [T in ConfigOrderType]: MoveConfig;
} = {
  attack: {
    shape: 'diagonal',
    xAllowed: [1, -1],
    yAllowed: [1],
  },
  'move-straight': {
    shape: 'straight',
    xAllowed: [0],
    yAllowed: [1],
  },
  'move-diagonal': {
    shape: 'diagonal',
    xAllowed: [1, -1],
    yAllowed: [1],
  },
  'push-straight': {
    shape: 'straight',
    xAllowed: [1, -1],
    yAllowed: [1, -1],
  },
  'push-diagonal': {
    shape: 'diagonal',
    xAllowed: [1, -1],
    yAllowed: [1, -1],
  },
  place: {
    shape: 'area',
    yAllowed: [0],
    absolute: true, // meaning not relative to piece
  },
};

export function isValidOrder(pieceOwner: 0 | 1, order: Order): boolean {
  const config = ORDER_CONFIG[order.type as ConfigOrderType];
  const { shape, xAllowed, yAllowed } = config;

  const yRelative = order.toTarget.y;
  const yChange = pieceOwner === 0 ? yRelative : -yRelative;

  const xChange = order.toTarget.x;

  let angleValid = true;
  if (shape === 'straight') {
    angleValid = isStraight(order.toTarget);
    // could technically be [0,0] with this
    if (xAllowed) xAllowed.push(0);
    if (yAllowed) yAllowed.push(0);
  }
  if (shape === 'diagonal') {
    angleValid = isDiagonal(order.toTarget);
  }
  if (order.type === 'place') {
    return isValidPlaceOrder(order);
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
  move: MoveDiagonalOrder,
): boolean {
  return isDiagonal(move.toTarget);
}

export function isValidMoveStraight(
  piece: Piece,
  move: MoveStraightOrder,
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

export function canAddPlaceOrder(order: PlaceOrder, G: GameState): boolean {
  if (!isValidPlaceOrder(order)) {
    return false;
  }
  if (G.config.placePriorityAssignment) {
    if (!order.newPiecePriority) {
      return false;
    }
    const { owner } = order;
    const { piecesToPlace } = G;
    if (!piecesToPlace || !piecesToPlace[owner] || !piecesToPlace[owner].length)
      return false;

    const piecesAlreadyBeingPlaced = G.orders[owner]
      .filter((order): order is PlaceOrder => order.type === 'place')
      .map((order) => order.newPiecePriority);
    const piecesLeftToPlace: number[] = [];
    piecesToPlace[owner].forEach((p) => {
      if (piecesAlreadyBeingPlaced.includes(p)) {
        const toRemove = piecesAlreadyBeingPlaced.findIndex((i) => i === p);
        piecesAlreadyBeingPlaced.splice(toRemove, 1);
      } else {
        piecesLeftToPlace.push(p);
      }
    });

    return piecesLeftToPlace.includes(order.newPiecePriority);
  } else {
    return true;
  }
}

// TODO does the origin solve the need for other order info?
export function getValidSquaresForOrder({
  origin = { x: 0, y: 0 },
  playerID,
  board,
  orderType,
}: {
  origin?: Coordinates;
  playerID: number;
  board: Coordinates;
  orderType: ConfigOrderType;
}) {
  // TODO:  make vectors, invert, translate

  const config = ORDER_CONFIG[orderType];
  const rawVectors: Coordinates[] = [];
  if (config.shape === 'straight') {
    config.xAllowed?.forEach((x) => rawVectors.push({ x, y: 0 }));
    config.yAllowed?.forEach((y) =>
      // invert as we create
      rawVectors.push({ x: 0, y: playerID === 0 ? y : -y }),
    );

    const translatedVectors = rawVectors.map((vector) => {
      return addDisplacement(vector, origin);
    });

    return translatedVectors;
  }

  // get valid X
  const xArray =
    config.xAllowed?.map((x) => x + origin.x) ||
    Array.from({ length: board.x }, (v, i) => i);

  // get valid Y
  let yAllowed = config.yAllowed?.map((y) => origin.y + y);
  // invert y for player 2
  if (playerID === 1 && config.yAllowed) {
    if (config.absolute) {
      yAllowed = config.yAllowed.map((y) => board.y - 1 - y);
    } else {
      yAllowed = config.yAllowed.map((y) => origin.y - y);
    }
  }

  const yArray = yAllowed || Array.from({ length: board.y }, (v, i) => i);

  const allCoords: Coordinates[] = xArray.flatMap((xVal) => {
    return yArray.map((yVal) => {
      return { x: xVal, y: yVal };
    });
  });
  return allCoords;
}
