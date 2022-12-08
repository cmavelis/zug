import type { Coordinates } from '@/game/common';
import { coordinatesToArray } from '@/game/common';
import type { GameState } from '@/game/Game';

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
  // apply orders
  if (orders[0].length > 0) {
    orders[0].forEach((order) => {
      // MOVE order
      if (order.type === 'move') {
        const newLocation = coordinatesToArray(order.moveTo, G.board);
        const oldLocation = cells.findIndex((i) => i === order.sourcePieceId);
        cells[oldLocation] = null;
        cells[newLocation] = order.sourcePieceId;
        pieces[order.sourcePieceId].position = order.moveTo;
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
        pieces[order.sourcePieceId].position = order.moveTo;
      }
    });
    orders[1] = [];
  }
  return G;
}
