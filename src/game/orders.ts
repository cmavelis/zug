import { isEqual, isNumber, remove } from 'lodash';
import type { Coordinates } from '@/game/common';
import { addDisplacement, coordinatesToArray } from '@/game/common';
import type { GameState } from '@/game/Game';
import {
  isValidAttack,
  isValidMoveDiagonal,
  isValidMoveStraight,
} from '@/game/zugzwang/validators';
import { logProxy } from '@/utils';

// orders are stored with displacement from piece to target
export interface OrderBase {
  sourcePieceId: number;
  toTarget: Coordinates;
}

export interface MoveStraightOrder extends OrderBase {
  type: 'move-straight';
  priority: 2;
}

export interface MoveDiagonalOrder extends OrderBase {
  type: 'move-diagonal';
  priority: 4;
}

export interface AttackOrder extends OrderBase {
  type: 'attack';
  priority: 3;
}

export interface DefendOrder extends OrderBase {
  type: 'defend';
  priority: 1;
}

export type Order =
  | MoveStraightOrder
  | MoveDiagonalOrder
  | AttackOrder
  | DefendOrder;

export type Orders = Order[];

function removePieces(G: GameState, pieceIDs: (number | undefined)[]) {
  const { cells, pieces } = G;

  pieceIDs.forEach((id) => {
    if (id === undefined) return;
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
      (a, b) => a.priority - b.priority
    );
    logProxy(ordersToResolve);

    // concurrent move resolution (for now)
    // if same priority
    //  if attack
    //   mark both attacked, wait to cleanup after
    //  if move
    //   if same square, destroy
    if (
      ordersToResolve[0] &&
      ordersToResolve[1] &&
      ordersToResolve[0].priority === ordersToResolve[1].priority
    ) {
      const pieceIDsToRemove: (number | undefined)[] = [];
      switch (ordersToResolve[0].type) {
        case 'attack':
          pieceIDsToRemove.push(applyAttack(ordersToResolve[0]));
          pieceIDsToRemove.push(applyAttack(ordersToResolve[1]));
          break;
        case 'move-straight' || 'move-diagonal':
          pieceIDsToRemove.concat(applyMove(ordersToResolve[0]));
          // @ts-ignore -- Haven't explicitly checked the type of [1], but order priorities are unique
          pieceIDsToRemove.concat(applyMove(ordersToResolve[1]));
          break;
        case 'defend':
          applyDefend(ordersToResolve[0]);
          // @ts-ignore -- Haven't explicitly checked the type of [1], but order priorities are unique
          applyDefend(ordersToResolve[1]);
      }
      removePieces(G, pieceIDsToRemove);
    } else {
      // sequential move resolution, already sorted by priority
      ordersToResolve.forEach((order) => {
        // allows for < 4 orders per person without error
        if (!order) return;
        switch (order.type) {
          case 'attack':
            // eslint-disable-next-line no-case-declarations
            const attackedPieceID = applyAttack(order);
            if (isNumber(attackedPieceID)) {
              removePieces(G, [attackedPieceID]);
            }
            break;
          case 'move-straight' || 'move-diagonal':
            applyMove(order);
            break;
        }
      });
    }
    // add cleanup here
    // removePieces(G, clashedPieceIDs);
  }

  function applyMove(order: MoveStraightOrder | MoveDiagonalOrder) {
    const movedPiece = pieces.find((p) => p.id === order.sourcePieceId);
    // piece might be removed prior to action
    if (!movedPiece) {
      console.log('piece ', order.sourcePieceId, ' no longer exists');
      return;
    }

    // validate
    if (
      order.type === 'move-straight' &&
      !isValidMoveStraight(movedPiece, order)
    ) {
      console.log(JSON.parse(JSON.stringify(order)));
      throw Error('Invalid action received');
    }
    if (
      order.type === 'move-diagonal' &&
      !isValidMoveDiagonal(movedPiece, order)
    ) {
      console.log(JSON.parse(JSON.stringify(order)));
      throw Error('Invalid action received');
    }

    // apply effects
    if (movedPiece) {
      const newPosition = addDisplacement(movedPiece.position, order.toTarget);

      const maybePiece = pieces.find((p) => p.position === newPosition);
      if (maybePiece) {
        // return for cleanup
        return [maybePiece.id, movedPiece.id];
      }

      movedPiece.position = newPosition;
    }
    const newLocation = coordinatesToArray(movedPiece.position, G.board);
    const oldLocation = cells.findIndex((i) => i === order.sourcePieceId);
    cells[oldLocation] = null;
    cells[newLocation] = order.sourcePieceId;

    return [];
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

      if (!(actingPiece && isValidAttack(actingPiece, order))) {
        console.log(order && JSON.parse(JSON.stringify(order)));
        console.log(actingPiece && JSON.parse(JSON.stringify(actingPiece)));
        throw Error('Invalid action received');
      }

      const targetSquare = addDisplacement(
        actingPiece.position,
        order.toTarget
      );
      const targetPiece = pieces.find((p) => isEqual(p.position, targetSquare));

      if (actingPiece && targetPiece && !targetPiece.isDefending) {
        return targetPiece.id;
      }
    }
  }

  function applyDefend(order: DefendOrder) {
    const actingPiece = pieces.find((p) => p.id === order.sourcePieceId);
    if (!actingPiece) {
      console.log('piece ', order.sourcePieceId, ' no longer exists');
      return;
    }
    actingPiece.isDefending = true;
  }

  // clear orders out for next turn
  orders[0] = [];
  orders[1] = [];

  // TODO: set all pieces to 'not defending'

  return G;
}
