<script setup lang="ts">
import BoardPiece from '@/components/BoardPiece.vue';
import type { GameState } from '@/game/Game';
import { chessClient } from '@/game/App';

interface BoardProps {
  state: { G: GameState };
}

const props = defineProps<BoardProps>();

const handleClick = (id: string) => {
  // chessClient.client.moves.clickCell(a);
  chessClient.client.moves.addOrder({
    pieceID: id,
    type: 'attack',
  });
};
</script>

<template>
  <div class="board-wrapper">
    <div class="board-container">
      <div
        v-for="(cell, index) in props.state.G.cells"
        :key="index"
        class="board-square"
      />
      <BoardPiece
        v-for="piece in props.state.G.pieces"
        :key="piece.position"
        v-bind="piece"
        @click="() => handleClick(piece.id)"
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
