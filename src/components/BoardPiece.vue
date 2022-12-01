<script setup lang="ts">
import { reactive } from 'vue';
import { type Piece } from '@/game/pieces';

const props = defineProps<Piece>();

const squareSize = 50;

const translateX = `${(props.position.x - 1) * squareSize}px`;
const translateY = `${(props.position.y - 1) * squareSize}px`;
const styleObject = reactive({
  transform: `translate(${translateX}, ${translateY})`,
  width: squareSize + 'px',
  height: squareSize + 'px',
});
</script>

<template>
  <div class="piece" :style="styleObject">{{ props.id.toString() }}</div>
</template>

<style scoped>
.piece {
  position: absolute;
}
</style>
