<script setup lang="ts">
import type { Coordinates } from '@/game/common';
import type { Piece } from '@/game/pieces';
import type { Order } from '@/game/orders';
import BoardPiece from './BoardPiece.vue';
import OrderOverlay from './OrderOverlay.vue';
import { computed } from 'vue';

interface BoardDisplayV2Props {
  board: Coordinates;
  pieces: Piece[];
  orders: Order[];
  showOrders?: boolean;
  handleCellClick?: (cellID: number) => void;
  handleCellHover?: (index: number) => void;
  handlePieceClick?: (id: number) => void;
  hoveredCell?: number;
  highlightedCells?: number[];
  selectedPieceId?: number;
  emphasizedPieceIds?: number[];
}

const props = withDefaults(defineProps<BoardDisplayV2Props>(), {
  showOrders: true,
  highlightedCells: () => [],
  handleCellClick: () => {},
  handleCellHover: () => {},
  handlePieceClick: () => {},
});

const boardCells = Array(props.board.x * props.board.y);
// cols, rows, used by css
const cols = computed(() => props.board.x);
const rows = computed(() => props.board.y);
</script>

<template>
  <div class="board-container">
    <div
      v-for="(_, index) in boardCells"
      :key="index"
      class="board-square"
      :class="{
        hoveredCell: props.hoveredCell === index,
        highlightedCell: props.highlightedCells.includes(index),
      }"
      @click="handleCellClick(index)"
      @mouseover="handleCellHover(index)"
    />
    <BoardPiece
      v-for="piece in props.pieces"
      :key="piece.id"
      :class="{
        selected: props.selectedPieceId === piece.id,
      }"
      :iconClass="{
        'halo-shadow': Boolean(props.emphasizedPieceIds?.includes(piece.id)),
      }"
      v-bind="piece"
      @click="handlePieceClick(piece.id)"
    />
    <svg v-if="props.showOrders" width="200" height="200">
      <OrderOverlay
        v-for="order in props.orders"
        :key="order.toString()"
        :order="order"
        :pieces="props.pieces"
      />
    </svg>
  </div>
</template>

<style scoped>
button {
  -webkit-appearance: none;
  min-height: 2.5rem;
}

.board-container {
  --cols: v-bind('cols');
  --rows: v-bind('rows');
  display: grid;
  grid-template-columns: repeat(var(--cols, 4), var(--square-size, 50px));
  grid-template-rows: repeat(var(--rows, 4), var(--square-size, 50px));
  border: 1px solid blanchedalmond;
  width: fit-content;
  height: fit-content;
}

.board-square {
  border: 1px solid blanchedalmond;
  z-index: 3; /* want this above the order overlay for hover events */
}

.hoveredCell {
  box-shadow:
    inset 0 0 5px cyan,
    inset 0 0 10px cyan;
}

.highlightedCell {
  background-color: cyan;
  opacity: 0.3;
}

section {
  display: flex;
  flex-direction: row;
  justify-content: space-evenly;
  padding: 1rem;
}

.selected {
  box-shadow:
    0 0 10px coral,
    0 0 5px coral;
}

svg {
  position: absolute;
  z-index: 2;
}
</style>
