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

import type { OrderBase, Orders, OrderTypes } from '@/game/orders';
import { isDiagonal } from '@/game/zugzwang/validators';

const DIR = 'N|NE|E|SE|S|SW|W|NW';
const ORDER = new RegExp(`^[ab][1-6](?:[pm](?:${DIR})|r[1-4])$`);

export const validateOrderNotation = (notation: string): boolean =>
  notation.length > 0 && notation.split(',').every((o) => ORDER.test(o));

const OWNER_MAP: { [a: string]: 0 | 1 } = { a: 0, b: 1 };
const ACTION_MAP = { m: 'move', p: 'push', r: 'place' };

type OrderTemplate = {
  owner: Pick<OrderBase, 'owner'>;
  toTarget: Pick<OrderBase, 'toTarget'>;
  type: OrderTypes;
  piecePriority: number;
};

export const getOrdersFromNotation = (
  ordersString: string,
): OrderTemplate[] => {
  const orders = ordersString.split(',').map((order) => {
    const playerString = order[0] as 'a' | 'b';
    const piecePriority = order[1];
    const actionString = order[2] as 'm' | 'p' | 'r';
    const direction = order.slice(3);

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

    const toTarget = { x, y };

    let actionType = ACTION_MAP[actionString];
    if ('mp'.includes(actionString)) {
      const suffix = isDiagonal(toTarget) ? 'diagonal' : 'straight';
      actionType += `-${suffix}`;
    }

    return {
      type: actionType,
      toTarget,
      owner: OWNER_MAP[playerString],
      piecePriority: Number(piecePriority),
      //TODO: conditionally change 'place' action details
    };
  });
  console.log(orders);
  // todo: return this to a function that uses Game state to find the right piece ID from the priority
  return orders;
};
