import type { Coordinates } from '@/game/common';
import { coordinatesToArray } from '@/game/common';
import type { GameState } from '@/game/Game';
import { isEqual, remove } from 'lodash';
import { moveValidator } from '@/game/zugzwang/validators';

export interface OrderBase {
  sourcePieceId: number;
}

export interface MoveOrder extends OrderBase {
  type: 'move';
  moveTo: Coordinates;
}

export interface AttackOrder extends OrderBase {
  type: 'attack';
  target: Coordinates;
}

export type Order = MoveOrder | AttackOrder;

export type Orders = Order[];

export function orderResolver({ G }: { G: GameState }) {
  const { cells, orders, pieces } = G;

  // Clashes pt 1
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

  const allMoves = moves0.concat(moves1);

  function applyMove(order: Order) {
    // MOVE order
    if (order.type === 'move') {
      const movedPiece = pieces.find((p) => p.id === order.sourcePieceId);
      if (!(movedPiece && moveValidator(movedPiece, order))) {
        throw Error('Invalid move received');
      }

      // MOVE type specific effects
      if (movedPiece) {
        movedPiece.position = order.moveTo;
      }
      const newLocation = coordinatesToArray(order.moveTo, G.board);
      const oldLocation = cells.findIndex((i) => i === order.sourcePieceId);
      cells[oldLocation] = null;
      cells[newLocation] = order.sourcePieceId;
    }
  }

  // apply orders
  if (allMoves.length > 0) {
    allMoves.forEach(applyMove);
  }

  //clashes pt 2
  clashingMoves.forEach((m) => {
    // remove pieces from cells array
    const clashedPieceIDs = Object.values(m).flatMap((m) => m.sourcePieceId);
    clashedPieceIDs.forEach(
      (id) => (cells[cells.findIndex((c) => c === id)] = null)
    );

    // remove pieces from pieces array
    Object.values(m).forEach((move) => {
      remove(pieces, (p) => p.id === move.sourcePieceId);
    });
  });

  // clear orders out
  orders[0] = [];
  orders[1] = [];

  return G;
}
