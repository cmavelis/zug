import type { ICoordinates } from '@/game/common';

export interface IOrder {
  pieceID: any;
  moveTo: ICoordinates;
}

export type Orders = IOrder[];
