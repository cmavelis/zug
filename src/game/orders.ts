import { cloneDeep, countBy, forOwn, isEqual, remove } from 'lodash';
import type { Coordinates } from '@/game/common';
import {
  addDisplacement,
  arrayToCoordinates,
  coordinatesToArray,
  reportError,
} from '@/game/common';
import type { GameState, GObject } from '@/game/Game';
import {
  isValidMoveDiagonal,
  isValidMoveStraight,
  isValidOrder,
} from '@/game/zugzwang/validators';
import { logProxy } from '@/utils';
import type { Piece } from '@/game/pieces';
import { createPiece } from '@/game/pieces';

// CONFIG
const MOVES_CAN_PUSH = false;

// orders are stored with displacement from piece to target
export interface OrderBase {
  sourcePieceId: number;
  toTarget: Coordinates;
  owner: number;
  priority: number;
}

const ORDER_PRIORITIES = {
  defend: 1,
  'move-straight': 1,
  'push-straight': 2,
  attack: 3,
  'move-diagonal': 3,
  'push-diagonal': 4,
  place: 5,
};

export type OrderTypes = keyof typeof ORDER_PRIORITIES;

export interface MoveStraightOrder extends OrderBase {
  type: 'move-straight';
}

export interface MoveDiagonalOrder extends OrderBase {
  type: 'move-diagonal';
}

export interface PushStraightOrder extends OrderBase {
  type: 'push-straight';
}

export interface PushDiagonalOrder extends OrderBase {
  type: 'push-diagonal';
}

export interface AttackOrder extends OrderBase {
  type: 'attack';
}

export interface DefendOrder extends Omit<OrderBase, 'toTarget'> {
  type: 'defend';
}

export interface PlaceOrder extends OrderBase {
  type: 'place';
}

type MoveOrder = MoveStraightOrder | MoveDiagonalOrder;

export type Order =
  | MoveOrder
  | AttackOrder
  | DefendOrder
  | PushDiagonalOrder
  | PushStraightOrder
  | PlaceOrder;

export type Orders = Order[];

interface Move {
  id: number;
  newPosition: Coordinates;
}

function removePieces(G: GameState, pieceIDs: (number | undefined)[]) {
  const { cells, pieces } = G;

  pieceIDs.forEach((id) => {
    if (id === undefined) return;
    console.log('deleting piece with id:', id);
    // empty the cells
    cells[cells.findIndex((c) => c === id)] = null;
    // remove pieces
    remove(pieces, (p) => p.id === id);
  });
}

function movePieces(G: GameState, moveArray: Move[]) {
  const { cells, pieces } = G;

  moveArray.forEach((move) => {
    console.log('moving piece:', move.id);

    const movedPiece = pieces.find((p) => p.id === move.id);
    if (!movedPiece) return;

    console.log('moving to', move.newPosition);
    const newPosition = coordinatesToArray(move.newPosition, G.board);
    movedPiece.position = move.newPosition;
    const oldPosition = cells.findIndex((i) => i === move.id);
    cells[oldPosition] = null;
    cells[newPosition] = move.id;
  });
}

export function orderResolver({ G }: { G: GObject }) {
  const { cells, orders, pieces, score } = G;

  const turnHistory = [];

  // Assume both players submit 4 orders for now
  for (let i = 0; i < 4; i++) {
    // rank orders by priority
    const ordersToResolve = [orders[0][i], orders[1][i]].sort(
      (a, b) => a.priority - b.priority
    );
    logProxy(ordersToResolve);

    const ordersUsed = {
      0: ordersToResolve[0] ? [ordersToResolve[0]] : [],
      1: ordersToResolve[1] ? [ordersToResolve[1]] : [],
    };

    if (ordersToResolve[0] || ordersToResolve[1]) {
      // copy game state for player review
      turnHistory.push(
        cloneDeep({
          cells,
          orders: ordersUsed,
          pieces,
          score,
        })
      );
    }

    // concurrent move resolution
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
        case 'move-straight':
        case 'move-diagonal': {
          // @ts-ignore -- Haven't explicitly checked the type of [1], but order priorities are unique
          if (didMovesCancel(ordersToResolve[0], ordersToResolve[1])) {
            break;
          }
          const pushArray = [];
          pushArray.push(...applyMove(ordersToResolve[0]));
          // @ts-ignore -- Haven't explicitly checked the type of [1], but order priorities are unique
          pushArray.push(...applyMove(ordersToResolve[1]));
          // TODO: special handling for concurrent pushes
          movePieces(G, pushArray);
          break;
        }
        case 'push-diagonal':
        case 'push-straight': {
          // @ts-ignore -- Haven't explicitly checked the type of [1], but order priorities are unique
          if (didMovesCancel(ordersToResolve[0], ordersToResolve[1])) {
            break;
          }
          const pushArray: Move[] = [];
          pushArray.push(...applyPush(ordersToResolve[0]));
          // @ts-ignore -- Haven't explicitly checked the type of [1], but order priorities are unique
          pushArray.push(...applyPush(ordersToResolve[1]));

          movePieces(G, pushArray);
          break;
        }
        case 'defend':
          applyDefend(ordersToResolve[0]);
          // @ts-ignore -- Haven't explicitly checked the type of [1], but order priorities are unique
          applyDefend(ordersToResolve[1]);
          break;
        case 'place':
          applyPlace(ordersToResolve[0]);
          // @ts-ignore -- Haven't explicitly checked the type of [1], but order priorities are unique
          applyPlace(ordersToResolve[1]);
      }
      pieceIDsToRemove.push(...findDisallowedPieces(G));
      removePieces(G, pieceIDsToRemove);
    } else {
      // sequential move resolution, already sorted by priority
      ordersToResolve.forEach((order) => {
        // allows for < 4 orders per person without error
        if (!order) return;
        const pieceIDsToRemove: (number | undefined)[] = [];
        switch (order.type) {
          case 'attack':
            pieceIDsToRemove.push(applyAttack(order));
            break;
          case 'move-straight':
          case 'move-diagonal':
            movePieces(G, applyMove(order));
            break;
          case 'push-straight':
          case 'push-diagonal':
            movePieces(G, applyPush(order));
            break;
          case 'defend':
            applyDefend(order);
            break;
          case 'place':
            applyPlace(order);
        }
        pieceIDsToRemove.push(...findDisallowedPieces(G));
        removePieces(G, pieceIDsToRemove);
      });
    }
    // -- CLEANUP --
    // truncate cells array if it got weird from pieces being pushed off
    const cellsArraySize = G.board.x * G.board.y;
    if (G.cells.length > cellsArraySize) {
      G.cells.length = cellsArraySize;
    }
  }

  // return array of "pushes" to be applied
  function applyMove(order: MoveStraightOrder | MoveDiagonalOrder): Move[] {
    const movedPiece = pieces.find((p) => p.id === order.sourcePieceId);
    // piece might be removed prior to action
    if (!movedPiece) {
      console.log('piece ', order.sourcePieceId, ' no longer exists');
      return [];
    }

    // validate
    if (
      order.type === 'move-straight' &&
      !isValidMoveStraight(movedPiece, order)
    ) {
      console.log(JSON.parse(JSON.stringify(order)));
      reportError('Invalid action received');
    }
    if (
      order.type === 'move-diagonal' &&
      !isValidMoveDiagonal(movedPiece, order)
    ) {
      console.log(JSON.parse(JSON.stringify(order)));
      reportError('Invalid action received');
    }

    // apply effects
    if (MOVES_CAN_PUSH) {
      const pushesArray = getPushes(movedPiece, order.toTarget);
      console.log('pushesArray', pushesArray);

      // do another check?
      return pushesArray;
    } else {
      const newPosition = addDisplacement(movedPiece.position, order.toTarget);
      const maybePiece = pieces.find((p) => isEqual(p.position, newPosition));
      if (maybePiece) {
        return [];
      }
      return [{ id: movedPiece.id, newPosition }];
    }
  }

  // return array of "pushes" to be applied
  function applyPush(order: PushStraightOrder | PushDiagonalOrder): Move[] {
    const pushingPiece = pieces.find((p) => p.id === order.sourcePieceId);
    // piece might be removed prior to action
    if (!pushingPiece) {
      console.log('piece ', order.sourcePieceId, ' no longer exists');
      return [];
    }

    // todo validate

    // apply effects
    const pushesArray = getPushes(pushingPiece, order.toTarget);
    pushesArray.shift();
    console.log('pushesArray', pushesArray);

    // do another check?
    return pushesArray;
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

      if (!(actingPiece && isValidOrder(actingPiece, order))) {
        console.log(order && JSON.parse(JSON.stringify(order)));
        console.log(actingPiece && JSON.parse(JSON.stringify(actingPiece)));
        reportError('Invalid action received');
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

  function applyPlace(order: PlaceOrder) {
    createPiece({
      G,
      pieceToCreate: { owner: order.owner, position: order.toTarget },
    });
  }

  function getPushes(pushingPiece: Piece, vector: Coordinates) {
    const pushesArray: Move[] = [];
    const checkPush = (
      currentArray: Move[] = [],
      pushingPiece: Piece,
      vector: Coordinates
    ) => {
      const newPosition = addDisplacement(pushingPiece.position, vector);
      currentArray.push({ id: pushingPiece.id, newPosition });
      const maybePiece = pieces.find((p) => isEqual(p.position, newPosition));

      if (maybePiece) {
        checkPush(currentArray, maybePiece, vector);
      } else {
        pushesArray.push(...currentArray);
      }
    };
    checkPush([], pushingPiece, vector);

    // do another check?
    return pushesArray;
  }

  function didMovesCancel(order1: MoveOrder, order2: MoveOrder) {
    const movedPiece1 = pieces.find((p) => p.id === order1.sourcePieceId);
    if (!movedPiece1) {
      return false;
    }
    const movedPiece2 = pieces.find((p) => p.id === order2.sourcePieceId);
    if (!movedPiece2) {
      return false;
    }

    const target1 = addDisplacement(movedPiece1.position, order1.toTarget);
    const target2 = addDisplacement(movedPiece2.position, order2.toTarget);

    const targetEachOther =
      isEqual(target1, movedPiece2.position) &&
      isEqual(target2, movedPiece1.position);
    const targetSameSquare = isEqual(target1, target2);

    // todo: check for push chains that conflict

    // noinspection RedundantIfStatementJS
    if (targetEachOther || targetSameSquare) {
      // the moves "bounce", cancel the orders
      return true;
    }
    return false;
  }

  G.history.push(turnHistory);

  // clear orders out for next turn
  orders[0] = [];
  orders[1] = [];

  // ----------------- END OF TURN -------------------------
  // set all pieces to 'not defending'
  pieces
    .filter((p) => p.isDefending)
    .forEach((p) => {
      p.isDefending = false;
    });

  // score & remove pieces in the goal
  const toRemove: number[] = [];
  pieces.forEach((p) => {
    if (p.owner === 0 && p.position.y === 3) {
      toRemove.push(p.id);
      G.score[0] += 1;
    } else if (p.owner === 1 && p.position.y === 0) {
      toRemove.push(p.id);
      G.score[1] += 1;
    }
  });

  // add score events to history
  turnHistory.push(
    cloneDeep({
      cells,
      orders: [],
      pieces,
      score,
      events: toRemove.map((id) => ({
        type: 'score',
        sourcePieceId: id,
      })),
    })
  );
  removePieces(G, toRemove);

  return G;
}

export function createOrder(
  order: Omit<OrderBase, 'priority'>,
  type: OrderTypes
): Order {
  return {
    ...order,
    type,
    priority: ORDER_PRIORITIES[type],
  };
}

// get ids for pieces that need to be removed
function findDisallowedPieces(G: GameState): number[] {
  const pieceIDs: number[] = [];

  // pieces off the board
  G.pieces.forEach((p) => {
    if (!isPositionOnBoard(G, p.position)) {
      pieceIDs.push(p.id);
    }
  });

  // overlapping pieces -- should I not allow this to happen in the first place?
  const overlapPositions = countBy(G.pieces, (p) =>
    coordinatesToArray(p.position, G.board)
  );
  forOwn(overlapPositions, (v, k) => {
    // if 2 pieces found at position
    if (v > 1) {
      // key is the position as an array index, so convert to coord
      const overlapCoordinate = arrayToCoordinates(Number(k), G.board);
      const filterPieces = G.pieces.filter((p) =>
        isEqual(p.position, overlapCoordinate)
      );
      filterPieces.forEach((p) => pieceIDs.push(p.id));
    }
  });

  return pieceIDs;
}

// assumes rectangular board
function isPositionOnBoard(G: GameState, position: Coordinates): boolean {
  if (position.x < 0 || position.x >= G.board.x) {
    return false;
  }
  return !(position.y < 0 || position.y >= G.board.y);
}
