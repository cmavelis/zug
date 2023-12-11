<script setup lang="ts">
import type { Coordinates } from '@/game/common';
import type { Piece } from '@/game/pieces';
import type { Order } from '@/game/orders';
import BoardPiece from './BoardPiece.vue';
import OrderOverlay from './OrderOverlay.vue';
import { computed, ref } from 'vue';
import { BOARD_PIXEL_SIZE } from '@/constants';

import { useToast } from 'primevue/usetoast';
import SpeedDial from 'primevue/speeddial';

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

const toast = useToast();
const items = ref([
  {
    label: 'Add',
    icon: 'pi pi-pencil',
    command: () => {
      toast.add({ severity: 'info', summary: 'Add', detail: 'Data Added' });
    },
  },
  {
    label: 'Update',
    icon: 'pi pi-refresh',
    command: () => {
      toast.add({
        severity: 'success',
        summary: 'Update',
        detail: 'Data Updated',
      });
    },
  },
  {
    label: 'Delete',
    icon: 'pi pi-trash',
    command: () => {
      toast.add({
        severity: 'error',
        summary: 'Delete',
        detail: 'Data Deleted',
      });
    },
  },
  {
    label: 'Vue Website',
    icon: 'pi pi-external-link',
    command: () => {
      window.location.href = 'https://vuejs.org/';
    },
  },
]);

const boardCells = Array(props.board.x * props.board.y);
// cols, rows, used by css
const cols = computed(() => props.board.x);
const rows = computed(() => props.board.y);
const svgSideLength = BOARD_PIXEL_SIZE * 4;
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
        'board-piece': true,
      }"
      :iconClass="{
        'halo-shadow': Boolean(props.emphasizedPieceIds?.includes(piece.id)),
      }"
      v-bind="piece"
      @click="handlePieceClick(piece.id)"
    >
      <template #menu>
        <SpeedDial
          :visible="props.selectedPieceId === piece.id"
          :model="items"
          :radius="60"
          type="semi-circle"
          direction="up"
          :style="{
            left: 'calc(50% - 2rem)',
            bottom: 0,
          }"
          :pt="{
            button: {
              style: { background: 'transparent' },
            },
          }"
        /> </template
    ></BoardPiece>
    <svg v-if="props.showOrders" :width="svgSideLength" :height="svgSideLength">
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

.board-piece {
  z-index: 3; /* above squares for clicking piece */
}

.board-square {
  border: 1px solid blanchedalmond;
  z-index: 2; /*want this above the order overlay for hover events */
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
  z-index: 5; /* above other pieces for clicking menu */
}

svg {
  pointer-events: none;
  position: absolute;
  z-index: 4;
}

/* used */
.speed-dial-button {
  background: transparent;
}
</style>
