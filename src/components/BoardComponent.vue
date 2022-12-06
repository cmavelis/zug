<script setup lang="ts">
import { ref } from 'vue';
import type { Ref } from 'vue';
import BoardPiece from '@/components/BoardPiece.vue';
import type { GameState } from '@/game/Game';
import type { Order } from '@/game/orders';
import type { _ClientImpl } from 'boardgame.io/dist/types/src/client/client';
import { arrayToCoordinates } from '@/game/common';

interface BoardProps {
  client: _ClientImpl;
  state: { G: GameState };
}

const selectedPiece: Ref<null | number> = ref(null);
const cellHover: Ref<null | number> = ref(null);

const props = defineProps<BoardProps>();

const handlePieceClick = (id: number) => {
  if (typeof selectedPiece.value !== 'number') {
    selectedPiece.value = id;
  } else {
    const order: Order = {
      sourcePieceId: selectedPiece.value,
      targetPieceId: id,
      type: 'attack',
    };
    props.client.moves.addOrder(order);
    selectedPiece.value = null;
  }
};

const handleCellClick = (pieceID?: number) => {
  if (typeof pieceID !== 'number') {
    if (
      typeof selectedPiece.value === 'number' &&
      typeof cellHover.value === 'number'
    ) {
      const order: Order = {
        sourcePieceId: selectedPiece.value,
        type: 'move',
        moveTo: arrayToCoordinates(cellHover.value, props.state.G.board),
      };
      props.client.moves.addOrder(order);
      selectedPiece.value = null;
    }
  } else {
    handlePieceClick(pieceID);
  }
};

const handleCellHover = (cellId: number) => {
  cellHover.value = cellId;
};

const handleEndTurn = () => {
  const { endStage } = props.client.events;
  if (endStage) endStage();
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
  <button @click="handleEndTurn">end turn</button>
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
