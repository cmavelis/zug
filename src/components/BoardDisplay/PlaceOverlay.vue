<script setup lang="ts">
import { computed } from 'vue';
import type { Order, PlaceOrder } from '@/game/orders';
import type { Coordinates } from '@/game/common';
import type { GameEvent } from '@/game/Game';
import { BOARD_PIXEL_SIZE } from '@/constants';

// all place orders get sent here, this component will group and show
interface Props {
  orders: PlaceOrder[];
}
const props = defineProps<Props>();

const sideLength = BOARD_PIXEL_SIZE;

// todo: share with orderoverlay
const coordsToPixels = (coordinates: Coordinates, squareLength: number) => {
  return {
    x: coordinates.x * squareLength + 0.5 * squareLength,
    y: coordinates.y * squareLength + 0.5 * squareLength,
  };
};

const groupedOrders = computed(() => {
  const { orders } = props;
  // group by toTarget
  const ordersMap = new Map();
  for (const order of orders) {
    const { toTarget, newPiecePriority } = order;
    const values = ordersMap.get(toTarget);
    const newValue = [newPiecePriority ?? '?'];
    if (values.length) {
      ordersMap.set(toTarget, values.concat(newValue));
    } else {
      ordersMap.set(toTarget, newValue);
    }
  }
  console.log(groupedOrders);
  // for each entry in group, show newPiecePriority or (+)
});

// const points = computed(() => {
//   if ('toTarget' in order && order.type === 'place') {
//     // "place" action
//     const { x: x1, y: y1 } = coordsToPixels(order.toTarget, sideLength);
//     return { x1, x2: x1, y1, y2: y1 };
//   }
//   return null;
// });

const lineColor = computed(() => {
  return 'darkcyan';
});
</script>

<template></template>

<style scoped>
circle {
  opacity: 0.5;
}
.order {
  pointer-events: none;
  position: absolute;
}
</style>
