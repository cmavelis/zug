<script setup lang="ts">
import { ref } from 'vue';
import type { Ref } from 'vue';
import BoardPiece from '@/components/BoardPiece.vue';
import type { GameState } from '@/game/Game';
import { chessClient } from '@/game/App';

interface BoardProps {
  state: { G: GameState };
}

const selectedPiece: Ref<null | string> = ref(null);
const cellHover: Ref<null | number> = ref(null);

const props = defineProps<BoardProps>();

const handlePieceClick = (id: string) => {
  // chessClient.client.moves.clickCell(a);
  if (!selectedPiece.value) {
    selectedPiece.value = id;
  } else {
    selectedPiece.value = null;
    chessClient.client.moves.addOrder({
      pieceID: id,
      type: 'attack',
    });
  }
};

const handleCellClick = (pieceID?: number) => {
  if (!pieceID) {
    return;
  }
  handlePieceClick(pieceID.toString());
};

const handleCellHover = (cellId: number) => {
  cellHover.value = cellId;
};
</script>

<template>
  <div class="board-wrapper">
    <div class="board-container">
      <div
        v-for="(cell, index) in props.state.G.cells"
        :key="index"
        class="board-square"
        :class="{ hoveredCell: cellHover === index }"
        @click="handleCellClick(cell)"
        @mouseover="handleCellHover(index)"
      />
      <BoardPiece
        v-for="piece in props.state.G.pieces"
        :key="piece.position"
        :class="{ selected: selectedPiece === piece.id }"
        v-bind="piece"
        @click="handlePieceClick(piece.id)"
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
  grid-template-rows: repeat(4, var(--square-size));
  border: 1px solid blanchedalmond;
  width: fit-content;
  margin: auto;
}

.board-square {
  border: 1px solid blanchedalmond;
}

.hoveredCell {
  box-shadow: inset 0 0 5px cyan;
}

.selected {
  box-shadow: 0 0 10px coral;
}
</style>
