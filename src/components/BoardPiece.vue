<script setup lang="ts">
import { reactive } from "vue";

interface PieceProps {
  type: string;
  position: [number, number];
}

const props = defineProps<PieceProps>();

const squareSize = 50;

const translateX = `${(props.position[0] - 1) * squareSize}px`;
const translateY = `${(props.position[1] - 1) * squareSize}px`;
const styleObject = reactive({
  transform: `translate(${translateX}, ${translateY})`,
  width: squareSize + "px",
  height: squareSize + "px",
});
</script>

<template>
  <div class="piece" :style="styleObject">{{ props.type }}</div>
</template>

<style scoped>
.piece {
  position: absolute;
}
</style>
