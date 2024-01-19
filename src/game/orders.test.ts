import { test, expect } from 'vitest';
import {
  arrangeOrderPairs,
  arrangeOrders,
  canPushWithConfig,
  createOrderArrayCompareFn,
} from '@/game/orders';
import { makeTestGame, makeTestOrder, makeTestPiece } from '@/game/test-utils';
import {
  PIECE_PRIORITIES_LIST,
  type PushRestrictionsConfig,
} from '@/game/zugzwang/config';

const piecePriority3 = makeTestPiece({ id: 0, priority: 3 });
const piecePriority1 = makeTestPiece({ id: 1, priority: 1 });

const piecePriority3Order = makeTestOrder({ sourcePieceId: 0 });
const piecePriority1Order = makeTestOrder({ sourcePieceId: 1 });
const piece1OrderPriority4 = makeTestOrder({ sourcePieceId: 1, priority: 4 });
const piecePlaceOrder = makeTestOrder({
  type: 'place',
  sourcePieceId: -1,
});

const G = makeTestGame({ pieces: [piecePriority3, piecePriority1] });
const orders = [piecePriority3Order, piecePriority1Order];
const ordersP2 = [piece1OrderPriority4, piecePriority1Order];

test('arrange actions, basic', () => {
  const sortedOrders = PIECE_PRIORITIES_LIST.map(() => null);
  orders.forEach(arrangeOrders(G, sortedOrders));
  expect(sortedOrders).toEqual([
    piecePriority1Order,
    null,
    piecePriority3Order,
    null,
    null,
    null,
  ]);
});

test('sort orders, different piece priorities', () => {
  const unsortedOrders = [piecePriority3Order, piecePriority1Order];
  const sortedOrders = unsortedOrders
    .slice()
    .sort(createOrderArrayCompareFn(G));

  expect(sortedOrders).toEqual([piecePriority1Order, piecePriority3Order]);
});

test('sort orders, same piece priorities', () => {
  const unsortedOrders = [piece1OrderPriority4, piecePriority1Order];
  const sortedOrders = unsortedOrders
    .slice()
    .sort(createOrderArrayCompareFn(G));

  expect(sortedOrders).toEqual([piecePriority1Order, piece1OrderPriority4]);
});

test('arrange order pairs, basic (new method)', () => {
  const sortedOrderPairs = arrangeOrderPairs(G, orders, ordersP2);
  expect(sortedOrderPairs).toEqual([
    [piecePriority1Order, piecePriority1Order],
    [null, piece1OrderPriority4],
    [piecePriority3Order, null],
  ]);
});

test('arrange order pairs, with place actions', () => {
  const sortedOrderPairs = arrangeOrderPairs(
    G,
    [piecePlaceOrder, piecePlaceOrder].concat(orders),
    [piecePlaceOrder].concat(ordersP2),
  );
  expect(sortedOrderPairs).toEqual([
    [piecePriority1Order, piecePriority1Order],
    [null, piece1OrderPriority4],
    [piecePriority3Order, null],
    [piecePlaceOrder, piecePlaceOrder],
    [piecePlaceOrder, null],
  ]);
});

test.each([
  [{ comparator: 'gt' }, 1, 1, false],
  [{ comparator: 'gte' }, 1, 1, true],
  [{ comparator: 'gt', add: 1 }, 1, 2, false],
  [{ comparator: 'gt', add: 2 }, 1, 2, true],
  [{ comparator: 'gt', multiply: 2 }, 1, 2, false],
  [{ comparator: 'gt', multiply: 2 }, 2, 3, true],
  [{ comparator: 'gt', multiply: 2, add: 1 }, 1, 3, false],
  [{ comparator: 'gte', multiply: 2, add: 1 }, 1, 3, true],
  [{ comparator: 'gt', multiply: 2, add: 1 }, 2, 4, true],
])(
  'canPushWithConfig(%s, %i, %i) -> %s',
  // @ts-ignore
  (a: PushRestrictionsConfig, b, c, expected) => {
    expect(
      canPushWithConfig(
        a,
        makeTestPiece({ priority: b }),
        makeTestPiece({ priority: c }),
      ),
    ).toBe(expected);
  },
);
