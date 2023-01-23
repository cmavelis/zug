import { isEqual, isNumber, remove } from 'lodash';
import type { Coordinates } from '@/game/common';
import { applyDisplacement, coordinatesToArray } from '@/game/common';
import type { GameState } from '@/game/Game';
import { attackValidator, moveValidator } from '@/game/zugzwang/validators';

// orders are stored with displacement from piece to target
export interface OrderBase {
  sourcePieceId: number;
  toTarget: Coordinates;
}

export interface MoveOrder extends OrderBase {
  type: 'move';
}

export interface AttackOrder extends OrderBase {
  type: 'attack';
}

export type Order = MoveOrder | AttackOrder;

export type Orders = Order[];

function removePieces(G: GameState, pieceIDs: number[]) {
  const { cells, pieces } = G;

  pieceIDs.forEach((id) => {
    // empty the cells
    cells[cells.findIndex((c) => c === id)] = null;
    // remove pieces
    remove(pieces, (p) => p.id === id);
  });
}

export function orderResolver({ G }: { G: GameState }) {
  const { cells, orders, pieces } = G;

  // clashing MOVEs pt 1
  const moves0 = orders[0].filter(
    (order): order is MoveOrder => order.type === 'move'
  );
  const moves1 = orders[1].filter(
    (order): order is MoveOrder => order.type === 'move'
  );
  const clashingMoves: Array<{ [index: number]: MoveOrder }> = [];
  // TODO
  // moves0.forEach((order0) => {
  //   moves1.forEach((order1) => {
  //     if (isEqual(order0.toTarget, order1.toTarget)) {
  //       clashingMoves.push({
  //         0: order0,
  //         1: order1,
  //       });
  //     }
  //   });
  // });
  // removed further down, in cleanup
  const clashedPieceIDs = clashingMoves.flatMap((m) => {
    return Object.values(m).flatMap((m) => m.sourcePieceId) || [];
  });

  const allMoves = moves0.concat(moves1);
  const allAttacks = orders[0]
    .concat(orders[1])
    .filter((order): order is AttackOrder => order.type === 'attack');

  function applyMove(order: Order) {
    // MOVE order
    if (order.type === 'move') {
      const movedPiece = pieces.find((p) => p.id === order.sourcePieceId);
      if (!(movedPiece && moveValidator(movedPiece, order))) {
        console.log(JSON.parse(JSON.stringify(order)));
        throw Error('Invalid action received');
      }

      // MOVE type specific effects
      if (movedPiece) {
        movedPiece.position = applyDisplacement(
          movedPiece.position,
          order.toTarget
        );
      }
      const newLocation = coordinatesToArray(movedPiece.position, G.board);
      const oldLocation = cells.findIndex((i) => i === order.sourcePieceId);
      cells[oldLocation] = null;
      cells[newLocation] = order.sourcePieceId;
    }
  }

  function applyAttack(order: Order) {
    // filter for order type
    if (order.type === 'attack') {
      const actingPiece = pieces.find((p) => p.id === order.sourcePieceId);
      if (!(actingPiece && attackValidator(actingPiece, order))) {
        console.log(JSON.parse(JSON.stringify(order)));
        console.log(JSON.parse(JSON.stringify(actingPiece)));
        throw Error('Invalid action received');
      }

      const targetSquare = applyDisplacement(
        actingPiece.position,
        order.toTarget
      );
      const targetPiece = pieces.find((p) => isEqual(p.position, targetSquare));
      // type specific effects
      if (actingPiece && targetPiece) {
        return targetPiece.id;
      }
    }
  }

  const attackedPieceIDs: number[] = [];

  // apply orders
  if (allMoves.length > 0) {
    allMoves.forEach(applyMove);
  }
  if (allAttacks.length > 0) {
    allAttacks.forEach((attack) => {
      const attackedPieceID = applyAttack(attack);
      if (isNumber(attackedPieceID)) {
        attackedPieceIDs.push(attackedPieceID);
      }
    });
  }

  removePieces(G, attackedPieceIDs);
  removePieces(G, clashedPieceIDs);

  // clear orders out for next turn
  orders[0] = [];
  orders[1] = [];

  return G;
}
