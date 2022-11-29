import type { ICoordinates } from '@/game/common';

export interface IOrderBase {
  pieceID: any;
}

export interface IMoveOrder extends IOrderBase {
  type: 'move';
  moveTo: ICoordinates;
}

export interface IAttackOrder extends IOrderBase {
  type: 'attack';
}

export type IOrder = IMoveOrder | IAttackOrder;

export type Orders = IOrder[];
