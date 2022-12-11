<script setup lang="ts">
import { reactive } from 'vue';
import { type Piece } from '@/game/pieces';

const props = defineProps<Piece>();

const squareSize = 50;

const translateX = `${props.position.x * squareSize}px`;
const translateY = `${props.position.y * squareSize}px`;
const styleObject = reactive({
  transform: `translate(${translateX}, ${translateY})`,
  width: squareSize + 'px',
  height: squareSize + 'px',
});

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
