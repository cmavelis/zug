import type { Coordinates } from '@/game/common';

export interface OrderBase {
  pieceID: any;
}

export interface MoveOrder extends OrderBase {
  type: 'move';
  moveTo: Coordinates;
}

export interface AttackOrder extends OrderBase {
  type: 'attack';
}

export type Order = MoveOrder | AttackOrder;

export type Orders = Order[];
