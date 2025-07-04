import { test, expect } from 'vitest';
import {
  arrangeOrderPairs,
  canPushWithConfig,
  createOrderArrayCompareFn,
  orderResolver,
} from '@/game/orders';
import { makeTestGame, makeTestOrder, makeTestPiece } from '@/game/test-utils';
import { type PushRestrictionsConfig } from '@/game/zugzwang/config';

const piecePriority3 = makeTestPiece({ id: 0, priority: 3 });
const piecePriority1 = makeTestPiece({ id: 1, priority: 1 });

const piecePriority3Order = makeTestOrder({ sourcePieceId: 0 });
const piecePriority1Order = makeTestOrder({ sourcePieceId: 1 });
const piece1OrderPriority4 = makeTestOrder({ sourcePieceId: 1, priority: 4 });
const piecePlaceOrder = makeTestOrder({
  type: 'place',
  sourcePieceId: -1,
});
const priority1PlaceOrder = makeTestOrder({
  type: 'place',
  sourcePieceId: -1,
  newPiecePriority: 1,
});
const priority3PlaceOrder = makeTestOrder({
  type: 'place',
  sourcePieceId: -1,
  newPiecePriority: 3,
});
const priority6PlaceOrder = makeTestOrder({
  type: 'place',
  sourcePieceId: -1,
  newPiecePriority: 6,
});

const G = makeTestGame({ pieces: [piecePriority3, piecePriority1] });
const orders = [piecePriority3Order, piecePriority1Order];
const ordersP2 = [piece1OrderPriority4, piecePriority1Order];

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

test('arrange order pairs, with prioritized place actions', () => {
  const sortedOrderPairs = arrangeOrderPairs(
    G,
    [priority6PlaceOrder, priority1PlaceOrder, priority3PlaceOrder].concat(
      orders,
    ),
    [priority6PlaceOrder].concat(ordersP2),
  );
  expect(sortedOrderPairs).toEqual([
    [piecePriority1Order, piecePriority1Order],
    [null, piece1OrderPriority4],
    [priority1PlaceOrder, null],
    [piecePriority3Order, null],
    [priority3PlaceOrder, null],
    [priority6PlaceOrder, priority6PlaceOrder],
  ]);
});

test.each([
  [{}, 1, 1, true],
  [{ add: 1 }, 1, 3, false],
  [{ add: 2 }, 1, 3, true],
  [{ multiply: 2 }, 1, 3, false],
  [{ multiply: 2 }, 2, 3, true],
  [{ multiply: 2, add: 1 }, 1, 4, false],
  [{ multiply: 2, add: 1 }, 2, 5, true],
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

test('diagonal move blocked when target space remains occupied', () => {
  // Setup a game state with two pieces
  // Piece 1 at (1,1) will try to move diagonally to (2,2)
  // Piece 2 at (2,2) will NOT move (no order)
  // The diagonal move should be blocked
  
  const piece1 = makeTestPiece({ 
    id: 1, 
    position: { x: 1, y: 1 }, 
    owner: 0,
    priority: 1
  });
  const piece2 = makeTestPiece({ 
    id: 2, 
    position: { x: 2, y: 2 }, 
    owner: 1,
    priority: 2
  });
  
  // Initialize cells array to match pieces
  const cells = new Array(16).fill(null); // 4x4 board
  cells[5] = 1; // piece 1 at (1,1) -> index 5
  cells[10] = 2; // piece 2 at (2,2) -> index 10
  
  const diagonalMoveOrder = makeTestOrder({
    type: 'move-diagonal',
    sourcePieceId: 1,
    toTarget: { x: 1, y: 1 }, // move from (1,1) to (2,2)
    owner: 0
  });
  
  const G = makeTestGame({ 
    pieces: [piece1, piece2],
    cells: cells,
    orders: {
      0: [diagonalMoveOrder],
      1: [] // No orders for player 1, so piece 2 doesn't move
    }
  });
  
  // Test that the orderResolver blocks the diagonal move
  const resultG = orderResolver({ G: { ...G, history: [] } });
  
  // After resolution:
  // - Piece 1 should remain at (1,1) because the move was blocked
  // - Piece 2 should remain at (2,2)
  const finalPiece1 = resultG.pieces.find(p => p.id === 1);
  const finalPiece2 = resultG.pieces.find(p => p.id === 2);
  
  expect(finalPiece1?.position).toEqual({ x: 1, y: 1 });
  expect(finalPiece2?.position).toEqual({ x: 2, y: 2 });
});

test('diagonal move into space that piece is moving out of', () => {
  // Setup a game state with two pieces
  // Piece 1 at (1,1) will move diagonally to (2,2) 
  // Piece 2 at (2,2) will move straight to (2,1)
  // Both moves should succeed because piece 2 moves out first
  
  const piece1 = makeTestPiece({ 
    id: 1, 
    position: { x: 1, y: 1 }, 
    owner: 0,
    priority: 3  // Higher priority so it moves second
  });
  const piece2 = makeTestPiece({ 
    id: 2, 
    position: { x: 2, y: 2 }, 
    owner: 1,
    priority: 1  // Lower priority so it moves first
  });
  
  // Initialize cells array to match pieces
  const cells = new Array(16).fill(null); // 4x4 board
  cells[5] = 1; // piece 1 at (1,1) -> index 5
  cells[10] = 2; // piece 2 at (2,2) -> index 10
  
  const diagonalMoveOrder = makeTestOrder({
    type: 'move-diagonal',
    sourcePieceId: 1,
    toTarget: { x: 1, y: 1 }, // move from (1,1) to (2,2)
    owner: 0
  });
  
  const straightMoveOrder = makeTestOrder({
    type: 'move-straight', 
    sourcePieceId: 2,
    toTarget: { x: 0, y: -1 }, // move from (2,2) to (2,1) - backward for owner 1
    owner: 1
  });
  
  const G = makeTestGame({ 
    pieces: [piece1, piece2],
    cells: cells,
    orders: {
      0: [diagonalMoveOrder],
      1: [straightMoveOrder]
    }
  });
  
  // Test that the orderResolver processes both moves successfully
  const resultG = orderResolver({ G: { ...G, history: [] } });
  
  // After resolution:
  // - Piece 1 should be at (2,2) 
  // - Piece 2 should be at (2,1)
  const finalPiece1 = resultG.pieces.find(p => p.id === 1);
  const finalPiece2 = resultG.pieces.find(p => p.id === 2);
  
  expect(finalPiece1?.position).toEqual({ x: 2, y: 2 });
  expect(finalPiece2?.position).toEqual({ x: 2, y: 1 });
});

test('diagonal move blocked when another piece moves into the same space', () => {
  // Setup a game state with two pieces
  // Piece 1 at (1,1) will try to move diagonally to (2,2) with priority 3
  // Piece 2 at (3,3) will move diagonally to (2,2) with priority 1 (higher priority)
  // Piece 1's move should be blocked because Piece 2 is moving INTO (2,2)
  
  const piece1 = makeTestPiece({ 
    id: 1, 
    position: { x: 1, y: 1 }, 
    owner: 0,
    priority: 3  // Lower priority so it moves second
  });
  const piece2 = makeTestPiece({ 
    id: 2, 
    position: { x: 3, y: 3 }, 
    owner: 1,
    priority: 1  // Higher priority so it moves first
  });
  
  // Initialize cells array to match pieces
  const cells = new Array(16).fill(null); // 4x4 board
  cells[5] = 1; // piece 1 at (1,1) -> index 5
  cells[15] = 2; // piece 2 at (3,3) -> index 15
  
  const diagonalMoveOrder1 = makeTestOrder({
    type: 'move-diagonal',
    sourcePieceId: 1,
    toTarget: { x: 1, y: 1 }, // move from (1,1) to (2,2)
    owner: 0
  });
  
  const diagonalMoveOrder2 = makeTestOrder({
    type: 'move-diagonal', 
    sourcePieceId: 2,
    toTarget: { x: -1, y: -1 }, // move from (3,3) to (2,2)
    owner: 1
  });
  
  const G = makeTestGame({ 
    pieces: [piece1, piece2],
    cells: cells,
    orders: {
      0: [diagonalMoveOrder1],
      1: [diagonalMoveOrder2]
    }
  });
  
  // Test that the orderResolver blocks piece 1's diagonal move
  const resultG = orderResolver({ G: { ...G, history: [] } });
  
  // After resolution:
  // - Piece 1 should remain at (1,1) because the move was blocked
  // - Piece 2 should be at (2,2) 
  const finalPiece1 = resultG.pieces.find(p => p.id === 1);
  const finalPiece2 = resultG.pieces.find(p => p.id === 2);
  
  expect(finalPiece1?.position).toEqual({ x: 1, y: 1 });
  expect(finalPiece2?.position).toEqual({ x: 2, y: 2 });
});
