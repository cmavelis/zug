/**
 * utilities for working with zug order notation
 *
 * example notation:
 *
 * const a = 'a1pN,a2mN,a3pNW,a4mNE,b2mS,b3mSW,b4pN,b5r3'
 *
 * piece id is consistent with board notation
 *  a is player 1
 *  b is player 2
 *  a1 is player 1's 1-piece
 *
 * action ids:
 *  (p)ush
 *  (m)ove
 *  (r)eplace
 *
 * octilinear directions, use compass
 *  NW NN NE
 *  WW    EE
 *  SW SS SE
 *
 * replace action can be: 1-4, indicating the baseline of the board
 *
 * ASSUMPTION
 *  There is only 1 piece per player of each priority
 *
 */

import type { OrderBase, OrderTypes } from '@/game/orders';
import { isDiagonal } from '@/game/zugzwang/validators';

const DIR = 'N|NE|E|SE|S|SW|W|NW';
const ORDER = new RegExp(`^[ab][1-6](?:[pm](?:${DIR})|r[1-4])$`);

export const validateOrderNotation = (notation: string): boolean =>
  notation.length > 0 && notation.split(',').every((o) => ORDER.test(o));

const OWNER_MAP: { [a: string]: 0 | 1 } = { a: 0, b: 1 };
const ACTION_MAP = { m: 'move', p: 'push' } as const;

type OrderTemplate = {
  owner: OrderBase['owner'];
  toTarget: OrderBase['toTarget'];
  type: OrderTypes;
  piecePriority: number;
};

/**
 * Converts an order notation string into order template objects
 * These objects need to be converted into order format using game state data
 */
export const getOrdersFromNotation = (
  ordersString: string,
): OrderTemplate[] => {
  const orders = ordersString.split(',').map((order) => {
    const playerString = order[0] as 'a' | 'b';
    const piecePriority = order[1];
    const actionString = order[2] as 'm' | 'p' | 'r';
    const direction = order.slice(3);

    const owner = OWNER_MAP[playerString];

    // move/push direction handling
    let x = 0;
    if (direction.includes('E')) {
      x = 1;
    } else if (direction.includes('W')) {
      x = -1;
    }
    let y = 0;
    if (direction.includes('N')) {
      y = -1;
    } else if (direction.includes('S')) {
      y = 1;
    }

    let toTarget = { x, y };

    let actionType: OrderTypes = 'place';
    if (actionString !== 'r') {
      const suffix = isDiagonal(toTarget) ? 'diagonal' : 'straight';
      actionType = `${ACTION_MAP[actionString]}-${suffix}`;
    } else {
      const placeX = Number(direction) - 1;
      const placeY = owner * 3;
      toTarget = { x: placeX, y: placeY };
    }

    return {
      type: actionType,
      toTarget,
      owner,
      piecePriority: Number(piecePriority),
    };
  });
  return orders;
};
