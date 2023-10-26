<script setup lang="ts">
import { computed } from 'vue';
import type { Piece } from '@/game/pieces';

const props = defineProps<Piece>();

const squareSize = 50;

const styleObject = computed(() => {
  const translateX = `${props.position.x * squareSize}px`;
  const translateY = `${props.position.y * squareSize}px`;

  return {
    transform: `translate(${translateX}, ${translateY})`,
    width: squareSize + 'px',
    height: squareSize + 'px',
  };
});

// need this? //const pieceColor = computed(() => (props.owner === 0 ? '#729bf1' : '#62d368'));

const pieceColor = props.owner === 0 ? '#729bf1' : '#62d368';
</script>

<template>
  <div class="piece" :style="styleObject">
    <div class="pieceIcon">{{ props.id }}</div>
  </div>
</template>

<style scoped>
.piece {
  pointer-events: none;
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1; /* below the order overlay */
}

.pieceIcon {
  background-color: v-bind(pieceColor);
  border-radius: 50%;
  height: 80%;
  width: 80%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: black;
}
</style>
