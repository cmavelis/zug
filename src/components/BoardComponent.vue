<script setup lang="ts">
import BoardPiece from '@/components/BoardPiece.vue';

interface BoardProps {
  state: any;
}

const props = defineProps<BoardProps>();

const squares = Array(9).fill('');
// const pieces = [
//   {
//     type: 'p1',
//     position: [1, 3],
//   },
//   {
//     type: 'p2',
//     position: [4, 4],
//   },
// ];
</script>

<template>
  <div class="board-wrapper">
    <div class="board-container">
      <div v-for="square in squares" :key="square" class="board-square"></div>
      <BoardPiece v-for="piece in pieces" :key="piece.type" v-bind="piece" />
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
