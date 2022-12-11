import type { Coordinates } from '@/game/common';
import { coordinatesToArray } from '@/game/common';
import type { GameState } from '@/game/Game';
import { isEqual, remove } from 'lodash';

export interface OrderBase {
  sourcePieceId: number;
}

export interface MoveOrder extends OrderBase {
  type: 'move';
  moveTo: Coordinates;
}

export interface AttackOrder extends OrderBase {
  type: 'attack';
  targetPieceId: number;
}

export type Order = MoveOrder | AttackOrder;

export type Orders = Order[];

export function orderResolver({ G }: { G: GameState }) {
  const { cells, orders, pieces } = G;

  const moves0 = orders[0].filter(
    (order): order is MoveOrder => order.type === 'move'
  );
  const moves1 = orders[1].filter(
    (order): order is MoveOrder => order.type === 'move'
  );

  const clashingMoves: Array<{ [index: number]: MoveOrder }> = [];

  moves0.forEach((order0) => {
    moves1.forEach((order1) => {
      if (isEqual(order0.moveTo, order1.moveTo)) {
        clashingMoves.push({
          0: order0,
          1: order1,
        });
      }
    });
  });

  // apply orders
  if (orders[0].length > 0) {
    orders[0].forEach((order) => {
      // MOVE order
      if (order.type === 'move') {
        const newLocation = coordinatesToArray(order.moveTo, G.board);
        const oldLocation = cells.findIndex((i) => i === order.sourcePieceId);
        cells[oldLocation] = null;
        cells[newLocation] = order.sourcePieceId;
        const movedPiece = pieces.find((p) => p.id === order.sourcePieceId);
        if (movedPiece) {
          movedPiece.position = order.moveTo;
        }
      }
    });
    orders[0] = [];
  }
  // TODO: DRY this up
  if (orders[1].length > 0) {
    orders[1].forEach((order) => {
      // MOVE order
      if (order.type === 'move') {
        const newLocation = coordinatesToArray(order.moveTo, G.board);
        const oldLocation = cells.findIndex((i) => i === order.sourcePieceId);
        cells[oldLocation] = null;
        cells[newLocation] = order.sourcePieceId;
        const movedPiece = pieces.find((p) => p.id === order.sourcePieceId);
        if (movedPiece) {
          movedPiece.position = order.moveTo;
        }
      }
    });
    orders[1] = [];
  }

  clashingMoves.forEach((m) => {
    const clashedPieceIDs = Object.values(m).flatMap((m) => m.sourcePieceId);
    clashedPieceIDs.forEach(
      (id) => (cells[cells.findIndex((c) => c === id)] = null)
    );

    // pullAll(
    //   cells,
    //   Object.values(m).map((m) => m.sourcePieceId)
    // );
    Object.values(m).forEach((move) => {
      remove(pieces, (p) => p.id === move.sourcePieceId);
    });
  });

  return G;
}
