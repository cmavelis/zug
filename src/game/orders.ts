import { cloneDeep, countBy, forOwn, isEqual, remove } from 'lodash';
import type { Coordinates } from '@/game/common';
import {
  addDisplacement,
  arrayToCoordinates,
  coordinatesToArray,
  getPiece,
  reportError,
} from '@/game/common';
import type { GameState, GObject } from '@/game/Game';
import {
  isValidMoveDiagonal,
  isValidMoveStraight,
  isValidOrder,
} from '@/game/zugzwang/validators';
import { logProxy } from '@/utils';
import type { Piece, PieceToCreate } from '@/game/pieces';
import { createPiece } from '@/game/pieces';
import { PRIORITIES_LIST, MOVES_CAN_PUSH } from '@/game/zugzwang/config';

// orders are stored with displacement from piece to target
export interface OrderBase {
  sourcePieceId: number;
  toTarget: Coordinates;
  owner: number;
  priority: number;
}

export const ORDER_PRIORITIES = {
  // defend: 1,
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
  newPiecePriority?: number;
}

type MoveOrder = MoveStraightOrder | MoveDiagonalOrder;

export type Order =
  | MoveOrder
  | AttackOrder
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
    const newPosition = coordinatesToArray(move.newPosition, G.config.board);
    movedPiece.position = move.newPosition;
    const oldPosition = cells.findIndex((i) => i === move.id);
    cells[oldPosition] = null;
    cells[newPosition] = move.id;
  });
}

export function orderResolver({ G }: { G: GObject }) {
  const { cells, orders, pieces, score } = G;

  const turnHistory = [];
  let sortedOrders1: (Order | null)[] = orders[0];
  let sortedOrders2: (Order | null)[] = orders[1];

  // "piece" variant sorts orders by piece ID instead of as submitted

  // create list with right # slots
  // iterate through orders, slotting in the right spot (error if occupied)
  // tack on "other" orders at the end (place, etc)
  if (G.config.priority === 'piece') {
    sortedOrders1 = PRIORITIES_LIST.map(() => null);
    sortedOrders2 = PRIORITIES_LIST.map(() => null);

    const arrangeOrders = (targetArray: (Order | null)[]) => (order: Order) => {
      const piece = getPiece(G, order.sourcePieceId);
      // "place" e.g.
      if (!piece) {
        targetArray.push(order);
        return;
      }
      const { priority } = piece;
      if (targetArray[priority - 1]) {
        console.error(
          `Order already exists for player with piece priority ${priority}`,
        );
        return;
      }
      targetArray[priority - 1] = order;
    };

    orders[0].forEach(arrangeOrders(sortedOrders1));
    orders[1].forEach(arrangeOrders(sortedOrders2));
  }

  const numberOrders = Math.max(sortedOrders1.length, sortedOrders2.length);
  for (let i = 0; i < numberOrders; i++) {
    const ordersToResolve = [sortedOrders1[i], sortedOrders2[i]];

    // for history
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
        }),
      );
    }

    // sort for sequential moves
    ordersToResolve.sort((a, b) => {
      if (!a || !b) return 0;
      return a.priority - b.priority;
    });
    console.log('resolving orders:');
    logProxy(ordersToResolve);

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
          // pushArray: moves that should be applied to each piece pushed
          const pushArrayOne = applyPush(ordersToResolve[0]);
          // @ts-ignore -- Haven't explicitly checked the type of [1], but order priorities are unique
          const pushArrayTwo = applyPush(ordersToResolve[1]);
          /**
           * *** filtering push arrays
           * situation 1:
           * - slide past
           * - - if `id` has already been moved => skip rest of array
           * situation 2:
           * - target same square
           * - - if same space targeted at same time, cancel moves (for now, maybe add vectors in future)
           */

          const movesToApply: Move[] = [];
          let applyMovesOne = true;
          let applyMovesTwo = true;

          let i = 0;
          while (i >= 0) {
            const moveOne: Move | undefined = pushArrayOne[i];
            const moveTwo: Move | undefined = pushArrayTwo[i];

            // target same spot => cancel all pushes
            if (
              moveOne &&
              moveTwo &&
              isEqual(moveOne.newPosition, moveTwo.newPosition)
            ) {
              break;
            }

            // if pieces targeting each other's spots => cancel all pushes
            if (moveOne && moveTwo) {
              const pieceOne = getPiece(G, moveOne.id);
              const pieceTwo = getPiece(G, moveTwo.id);
              if (
                pieceOne &&
                pieceTwo &&
                isEqual(moveOne.newPosition, pieceTwo.position) &&
                isEqual(pieceOne.position, moveTwo.newPosition)
              ) {
                break;
              }
            }

            // exit loop if nothing left
            if (!moveOne && !moveTwo) {
              break;
            }

            // if id has already been moved, prevent rest of chain
            if (movesToApply.some((move) => move.id === moveOne?.id)) {
              applyMovesOne = false;
            }
            if (movesToApply.some((move) => move.id === moveTwo?.id)) {
              applyMovesTwo = false;
            }

            // queue up moves
            if (moveOne && applyMovesOne) movesToApply.push(moveOne);
            if (moveTwo && applyMovesTwo) movesToApply.push(moveTwo);

            i++;
          }

          console.log('applying moves:');
          logProxy(movesToApply);
          movePieces(G, movesToApply);
          break;
        }
        case 'place':
          applyPlace(ordersToResolve[0]);
          // @ts-ignore -- Haven't explicitly checked the type of [1], but order priorities are unique
          applyPlace(ordersToResolve[1]);
      }
      if (G.config.outOfBounds === 'immediate' || !G.config.outOfBounds) {
        pieceIDsToRemove.push(...findOutOfBoundsPieces(G));
      }
      pieceIDsToRemove.push(...findOverlappingPieces(G));
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
          case 'place':
            applyPlace(order);
        }
        if (G.config.outOfBounds === 'immediate') {
          pieceIDsToRemove.push(...findOutOfBoundsPieces(G));
        }
        pieceIDsToRemove.push(...findOverlappingPieces(G));
        removePieces(G, pieceIDsToRemove);
      });
    }
    // -- CLEANUP --
    // truncate cells array if it got weird from pieces being pushed off
    const cellsArraySize = G.config.board.x * G.config.board.y;
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
        order.toTarget,
      );
      const targetPiece = pieces.find((p) => isEqual(p.position, targetSquare));

      if (actingPiece && targetPiece && !targetPiece.isDefending) {
        return targetPiece.id;
      }
    }
  }

  function applyPlace(order: PlaceOrder) {
    const pieceToCreate: PieceToCreate = {
      owner: order.owner,
      position: order.toTarget,
    };
    if (order.newPiecePriority) pieceToCreate.priority = order.newPiecePriority;
    createPiece({
      G,
      pieceToCreate,
    });
  }

  function getPushes(pushingPiece: Piece, vector: Coordinates) {
    const pushesArray: Move[] = [];
    const checkPush = (
      currentArray: Move[] = [],
      pushingPiece: Piece,
      vector: Coordinates,
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

  // remove OB pieces
  const outOfBoundsPieces = [];
  if (G.config.outOfBounds === 'turn-end') {
    outOfBoundsPieces.push(...findOutOfBoundsPieces(G));
  }
  removePieces(G, outOfBoundsPieces);

  // add OB events to history
  turnHistory.push(
    cloneDeep({
      cells,
      orders: [],
      pieces,
      score,
      events: outOfBoundsPieces.map((id) => ({
        type: 'destroy',
        sourcePieceId: id,
      })),
    }),
  );

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
    }),
  );
  removePieces(G, toRemove);

  return G;
}

export function createOrder(
  order: Omit<OrderBase, 'priority'>,
  type: OrderTypes,
): Order {
  return {
    ...order,
    type,
    priority: ORDER_PRIORITIES[type],
  };
}

function findOutOfBoundsPieces(G: GameState): number[] {
  const pieceIDs: number[] = [];

  // pieces off the board
  G.pieces.forEach((p) => {
    if (!isPositionOnBoard(G, p.position)) {
      pieceIDs.push(p.id);
      console.log(p.id, 'is not on board');
    }
  });

  return pieceIDs;
}

// get ids for pieces that need to be removed
function findOverlappingPieces(G: GameState): number[] {
  const pieceIDs: number[] = [];

  // overlapping pieces -- should I not allow this to happen in the first place?
  const overlapPositions = countBy(G.pieces, (p) =>
    coordinatesToArray(p.position, G.config.board),
  );
  forOwn(overlapPositions, (v, k) => {
    // if 2 pieces found at position
    if (v > 1) {
      // key is the position as an array index, so convert to coord
      const overlapCoordinate = arrayToCoordinates(Number(k), G.config.board);
      const filterPieces = G.pieces.filter((p) => {
        if (isEqual(p.position, overlapCoordinate)) {
          console.log('overlap:', overlapCoordinate);
          logProxy(p);
          return true;
        }
      });
      filterPieces.forEach((p) => {
        pieceIDs.push(p.id);
        console.log(p.id, 'overlaps another piece');
      });
    }
  });

  return pieceIDs;
}

// assumes rectangular board
function isPositionOnBoard(G: GameState, position: Coordinates): boolean {
  if (position.x < 0 || position.x >= G.config.board.x) {
    return false;
  }
  return !(position.y < 0 || position.y >= G.config.board.y);
}
