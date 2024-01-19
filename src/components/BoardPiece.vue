<script setup lang="ts">
import { computed } from 'vue';
import type { Piece } from '@/game/pieces';
import { BOARD_PIXEL_SIZE } from '@/constants';

interface BoardPiece extends Piece {
  iconClass?: { [key: string]: boolean };
  hints?: any[];
}

const props = defineProps<BoardPiece>();

const squareSize = BOARD_PIXEL_SIZE;

const styleObject = computed(() => {
  const translateX = `${props.position.x * squareSize}px`;
  const translateY = `${props.position.y * squareSize}px`;

  return {
    transform: `translate(${translateX}, ${translateY})`,
    width: squareSize + 'px',
    height: squareSize + 'px',
  };
});
</script>

<template>
  <div
    :class="{ piece: true, 'push-hint': Boolean(hints?.notPushable) }"
    :style="styleObject"
  >
    <div
      :class="{
        pieceIcon: true,
        pieceColor1: props.owner === 0,
        pieceColor2: props.owner === 1,
        ...props.iconClass,
      }"
    >
      {{ props.priority }}
    </div>
    <slot name="menu"></slot>
  </div>
</template>

<style scoped>
.piece {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1; /* below the order overlay */
  transition: transform 0.5s ease-out;
  font-size: medium;
  font-weight: bold;
}

.pieceIcon {
  border-radius: 50%;
  height: 80%;
  width: 80%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: black;
  cursor: pointer;
}

.push-hint::after {
  content: '🫸🚫';
  color: black;
  position: absolute;
  bottom: -6px;
  border-radius: 8px;
  background-color: rgba(0, 0, 0, 0.6);
}

.pieceColor1 {
  background-color: var(--sandy-brown);
}

.pieceColor2 {
  background-color: var(--vermilion);
}
</style>
