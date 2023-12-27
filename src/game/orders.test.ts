import { test, expect } from 'vitest';
import { arrangeOrders, createOrderArrayCompareFn } from '@/game/orders';
import { makeTestGame, makeTestOrder, makeTestPiece } from '@/game/test-utils';
import { PIECE_PRIORITIES_LIST } from '@/game/zugzwang/config';

const piecePriority3 = makeTestPiece({ id: 0, priority: 3 });
const piecePriority1 = makeTestPiece({ id: 1, priority: 1 });

const piecePriority3Order = makeTestOrder({ sourcePieceId: 0 });
const piecePriority1Order = makeTestOrder({ sourcePieceId: 1 });
const piece1OrderPriority4 = makeTestOrder({ sourcePieceId: 1, priority: 4 });

const G = makeTestGame({ pieces: [piecePriority3, piecePriority1] });
const orders = [piecePriority3Order, piecePriority1Order];

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

// test('arrange actions, basic (new method)', () => {
//   const sortedOrderPairs = orders.forEach(arrangeOrders(G, sortedOrders));
//   expect(sortedOrders).toEqual([
//     piecePriority1Order,
//     null,
//     piecePriority3Order,
//     null,
//     null,
//     null,
//   ]);
// });
