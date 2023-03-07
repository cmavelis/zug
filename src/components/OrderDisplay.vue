<script setup lang="ts">
import { computed } from 'vue';
import type { Order } from '@/game/orders';
import { isEqual } from 'lodash';
import type { GameState } from '@/game/Game';
import type { Coordinates } from '@/game/common';

interface Props {
  G: GameState;
  order: Order;
}

const props = defineProps<Props>();
const sideLength = 50;

const coordsToPixels = (coordinates: Coordinates, squareLength: number) => {
  return {
    x: coordinates.x * squareLength + 0.5 * squareLength,
    y: coordinates.y * squareLength + 0.5 * squareLength,
  };
};

const points = computed(() => {
  const { order } = props;
  const maybePiece = props.G.pieces.find((p) =>
    isEqual(p.id, order.sourcePieceId)
  );
  if (maybePiece) {
    const { x: x1, y: y1 } = coordsToPixels(maybePiece.position, sideLength);
    let x2 = 0;
    let y2 = 0;
    if ('toTarget' in order) {
      x2 = x1 + order.toTarget.x * sideLength;
      y2 = y1 + order.toTarget.y * sideLength;
    }
    return {
      x1,
      y1,
      x2,
      y2,
    };
  }
  return { x1: 0, y1: 0, x2: 0, y2: 0 };
});

const lineColor = computed(() => {
  if (props.order.type === 'attack') {
    return 'red';
  }
  return 'darkcyan';
});
</script>

<template>
  <g class="order">
    <circle
      v-if="order.type === 'defend'"
      :cx="points.x1"
      :cy="points.y1"
      r="27"
      fill="darkcyan"
    ></circle>
    <template v-else>
      <line
        :x1="points.x1"
        :y1="points.y1"
        :x2="points.x2"
        :y2="points.y2"
        :stroke="lineColor"
      ></line>
      <circle :cx="points.x1" :cy="points.y1" r="10" :fill="lineColor"></circle>
    </template>
  </g>
</template>

<style scoped>
circle {
  opacity: 0.5;
}
.order {
  pointer-events: none;
  position: absolute;
}
</style>
