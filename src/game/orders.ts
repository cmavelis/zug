import { countBy, forOwn, isEqual, remove } from 'lodash';
import type { Coordinates } from '@/game/common';
import {
  addDisplacement,
  arrayToCoordinates,
  coordinatesToArray,
} from '@/game/common';
import type { GameState, GObject } from '@/game/Game';
import {
  isValidAttack,
  isValidMoveDiagonal,
  isValidMoveStraight,
} from '@/game/zugzwang/validators';
import { logProxy } from '@/utils';
import type { Piece } from '@/game/pieces';

// orders are stored with displacement from piece to target
export interface OrderBase {
  sourcePieceId: number;
  toTarget: Coordinates;
  priority: number;
}

const ORDER_PRIORITIES = {
  defend: 1,
  'move-straight': 2,
  attack: 3,
  'move-diagonal': 4,
};

export type OrderTypes = keyof typeof ORDER_PRIORITIES;

export interface MoveStraightOrder extends OrderBase {
  type: 'move-straight';
}

export interface MoveDiagonalOrder extends OrderBase {
  type: 'move-diagonal';
}

export interface AttackOrder extends OrderBase {
  type: 'attack';
}

export interface DefendOrder extends Omit<OrderBase, 'toTarget'> {
  type: 'defend';
}

export type Order =
  | MoveStraightOrder
  | MoveDiagonalOrder
  | AttackOrder
  | DefendOrder;

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
  const { cells, orders, pieces } = G;

  // copy game state for player review
  G.history.push({
    cells,
    orders,
    pieces,
  });

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
        case 'move-straight':
        case 'move-diagonal':
          // eslint-disable-next-line no-case-declarations
          const pushArray = [];
          pushArray.push(...applyMove(ordersToResolve[0]));
          // @ts-ignore -- Haven't explicitly checked the type of [1], but order priorities are unique
          pushArray.push(...applyMove(ordersToResolve[1]));
          // TODO: special handling for concurrent pushes
          pushArray.forEach((push) => movePieces(G, push));
          break;
        case 'defend':
          applyDefend(ordersToResolve[0]);
          // @ts-ignore -- Haven't explicitly checked the type of [1], but order priorities are unique
          applyDefend(ordersToResolve[1]);
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
            applyMove(order).forEach((push) => movePieces(G, push));
            break;
          case 'defend':
            applyDefend(order);
            break;
        }
        pieceIDsToRemove.push(...findDisallowedPieces(G));
        removePieces(G, pieceIDsToRemove);
      });
    }
    // add cleanup here
    // removePieces(G, clashedPieceIDs);
  }

  // return array of "pushes" to be applied
  function applyMove(order: MoveStraightOrder | MoveDiagonalOrder) {
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
      const pushesArray: Move[][] = [];
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
          pushesArray.push(currentArray);
        }
      };
      checkPush([], movedPiece, order.toTarget);
      console.log('pushesArray', pushesArray);

      // do another check?
      return pushesArray;
    }

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

  // ----------------- END OF TURN -------------------------
  // set all pieces to 'not defending'
  pieces
    .filter((p) => p.isDefending)
    .forEach((p) => {
      p.isDefending = false;
    });

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
  if (position.x < 0 || position.x > G.board.x) {
    return false;
  }
  return !(position.y < 0 || position.y > G.board.y);
}
