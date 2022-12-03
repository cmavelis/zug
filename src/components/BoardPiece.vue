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
</script>

<template>
  <div class="piece" :style="styleObject">{{ props.id }}</div>
</template>

<style scoped>
.piece {
  pointer-events: none;
  position: absolute;
}
</style>
