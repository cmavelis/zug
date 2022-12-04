import type { Coordinates } from '@/game/common';

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
