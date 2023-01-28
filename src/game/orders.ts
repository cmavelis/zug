import { isEqual, isNumber, remove } from 'lodash';
import type { Coordinates } from '@/game/common';
import { addDisplacement, coordinatesToArray } from '@/game/common';
import type { GameState } from '@/game/Game';
import { attackValidator, moveValidator } from '@/game/zugzwang/validators';
import { logProxy } from '@/utils';

// orders are stored with displacement from piece to target
export interface OrderBase {
  sourcePieceId: number;
  toTarget: Coordinates;
}

export interface MoveOrder extends OrderBase {
  type: 'move';
  priority: 1;
}

export interface AttackOrder extends OrderBase {
  type: 'attack';
  priority: 2;
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

  // Assume both players submit 4 orders for now
  for (let i = 0; i < 4; i++) {
    // rank orders by priority
    const ordersToResolve = [orders[0][i], orders[1][i]].sort(
      (a, b) => b.priority - a.priority
    );
    logProxy(ordersToResolve);

    // concurrent move resolution
    // if (ordersToResolve[0].priority === ordersToResolve[1].priority) {
    // const pieceIDsToRemove: number[] = [];
    //  removePieces(G, attackedPieceIDs);
    // } else {}

    // sequential move resolution, by priority
    ordersToResolve.forEach((order) => {
      switch (order.type) {
        case 'attack':
          // eslint-disable-next-line no-case-declarations
          const attackedPieceID = applyAttack(order);
          if (isNumber(attackedPieceID)) {
            removePieces(G, [attackedPieceID]);
          }
          break;
        case 'move':
          applyMove(order);
          break;
      }
    });

    // add cleanup here
    // removePieces(G, clashedPieceIDs);
  }

  function applyMove(order: Order) {
    // MOVE order
    if (order.type === 'move') {
      const movedPiece = pieces.find((p) => p.id === order.sourcePieceId);
      if (!movedPiece) {
        console.log('piece ', order.sourcePieceId, ' no longer exists');
        return;
      }

      if (!(movedPiece && moveValidator(movedPiece, order))) {
        console.log(JSON.parse(JSON.stringify(order)));
        throw Error('Invalid action received');
      }

      // MOVE type specific effects
      if (movedPiece) {
        movedPiece.position = addDisplacement(
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

  // returns attacked piece ID
  function applyAttack(order: Order) {
    // filter for order type
    if (order.type === 'attack') {
      const actingPiece = pieces.find((p) => p.id === order.sourcePieceId);
      if (!actingPiece) {
        console.log('piece ', order.sourcePieceId, ' no longer exists');
        return;
      }

      if (!(actingPiece && attackValidator(actingPiece, order))) {
        console.log(order && JSON.parse(JSON.stringify(order)));
        console.log(actingPiece && JSON.parse(JSON.stringify(actingPiece)));
        throw Error('Invalid action received');
      }

      const targetSquare = addDisplacement(
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

  // clear orders out for next turn
  orders[0] = [];
  orders[1] = [];

  return G;
}
