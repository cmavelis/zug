<script setup lang="ts">
import BoardPiece from '@/components/BoardPiece.vue';
import type { IGameState } from '@/game/Game';

interface BoardProps {
  state: { G: IGameState };
}

const props = defineProps<BoardProps>();
</script>

<template>
  <div class="board-wrapper">
    <div class="board-container">
      <div
        v-for="(cell, index) in props.state.G.cells"
        :key="index"
        class="board-square"
      >
        {{ cell }}
      </div>
      <BoardPiece
        v-for="piece in props.state.G.pieces"
        :key="piece.position"
        v-bind="piece"
      />
    </div>
  </div>
  <p>{{ props.state.G }}</p>
</template>

<style scoped>
.board-wrapper {
  --square-size: 50px;
  position: relative;
}

.board-container {
  display: grid;
  grid-template-columns: repeat(3, var(--square-size));
  grid-template-rows: repeat(3, var(--square-size));
  border: 1px solid blanchedalmond;
  width: fit-content;
  margin: auto;
}

.board-square {
  border: 1px solid blanchedalmond;
}
</style>
