<script setup lang="ts">
import { computed } from 'vue';
import type { Order } from '@/game/orders';
import { isEqual } from 'lodash';
import type { Coordinates } from '@/game/common';
import type { Piece } from '@/game/pieces';
import type { GameEvent } from '@/game/Game';
import { BOARD_PIXEL_SIZE } from '@/constants';

interface Props {
  pieces: Piece[];
  order: Order | GameEvent;
}

const props = defineProps<Props>();
const sideLength = BOARD_PIXEL_SIZE;

const coordsToPixels = (coordinates: Coordinates, squareLength: number) => {
  return {
    x: coordinates.x * squareLength + 0.5 * squareLength,
    y: coordinates.y * squareLength + 0.5 * squareLength,
  };
};

const points = computed(() => {
  const { order } = props;
  const maybePiece = props.pieces.find((p) =>
    isEqual(p.id, order.sourcePieceId),
  );
  if (maybePiece) {
    const { x: x1, y: y1 } = coordsToPixels(maybePiece.position, sideLength);
    let x2 = x1;
    let y2 = y1;
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
  if ('toTarget' in order && order.type === 'place') {
    // "place" action
    const { x: x1, y: y1 } = coordsToPixels(order.toTarget, sideLength);
    return { x1, x2: x1, y1, y2: y1 };
  }
  return null;
});

const lineColor = computed(() => {
  if (props.order.type === 'attack') {
    return 'red';
  }
  if (
    props.order.type === 'push-diagonal' ||
    props.order.type === 'push-straight'
  ) {
    return 'yellow';
  }
  if (
    // hacking in score for now as Event type
    props.order.type === 'score'
  ) {
    return 'white';
  }
  return 'darkcyan';
});
</script>

<template>
  <g class="order">
    <line
      v-if="points !== null"
      :x1="points.x1"
      :y1="points.y1"
      :x2="points.x2"
      :y2="points.y2"
      :stroke="lineColor"
    ></line>
    <circle
      v-if="points !== null"
      :cx="points.x1"
      :cy="points.y1"
      r="10"
      :fill="lineColor"
    ></circle>
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
