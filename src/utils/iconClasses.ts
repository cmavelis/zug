import { ORDER_ENUM, type OrderTypes } from '@/game/orders';

export const iconClassesMap: { [key in OrderTypes]?: string } = {
  [ORDER_ENUM.moveStraight]: 'pi pi-arrow-up',
  [ORDER_ENUM.pushStraight]: 'zi zi-arrow-up-flat',
  [ORDER_ENUM.moveDiagonal]: 'pi pi-arrow-up-right',
  [ORDER_ENUM.pushDiagonal]: 'zi zi-arrow-up-right-flat',
};
