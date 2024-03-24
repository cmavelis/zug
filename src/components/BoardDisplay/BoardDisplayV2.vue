<script setup lang="ts">
import { computed } from 'vue';
import SpeedDial from 'primevue/speeddial';
import type { MenuItem } from 'primevue/menuitem';

import { BOARD_PIXEL_SIZE } from '@/constants';
import type { Coordinates } from '@/game/common';
import type { Piece } from '@/game/pieces';
import type { Order, PlaceOrder } from '@/game/orders';
import BoardPiece, { type PieceHint } from './BoardPiece.vue';
import OrderOverlay from './OrderOverlay.vue';

interface BoardDisplayV2Props {
  board: Coordinates;
  pieces: Piece[];
  orders: Order[];
  showOrders?: boolean;
  handleCellClick?: (cellID: number) => void;
  handleCellHover?: (index: number) => void;
  handlePieceClick?: (id: number, e?: Event) => void;
  handlePieceHover?: (id: number) => void;
  hoveredCell?: number;
  highlightedCells?: number[];
  selectedPieceId?: number;
  emphasizedPieceIds?: number[];
  actionMenuItems?: { [key: number]: MenuItem[] };
  targetingHints?: PieceHint[];
}

const props = withDefaults(defineProps<BoardDisplayV2Props>(), {
  showOrders: true,
  highlightedCells: () => [],
  handleCellClick: () => {},
  handleCellHover: () => {},
  handlePieceClick: () => {},
  handlePieceHover: () => {},
  actionMenuItems: () => ({}),
});

const boardCells = Array(props.board.x * props.board.y);
// cols, rows, used by css
const cols = computed(() => props.board.x);
const rows = computed(() => props.board.y);

const svgSideLength = BOARD_PIXEL_SIZE * 4;
const placeOrders = computed(() => {
  console.log(props.orders);
  const orders = props.orders.filter((o) => o.type === 'place') as PlaceOrder[];
  // group by toTarget
  const ordersGrouped: Record<string, number[]> = {};
  for (const order of orders) {
    const { toTarget, newPiecePriority } = order;
    const toTargetString = JSON.stringify(toTarget); // use index representation instead of string
    const values = ordersGrouped[toTargetString];
    const newValue = [newPiecePriority ?? -1];
    if (values?.length) {
      ordersGrouped[toTargetString] = values.concat(newValue);
    } else {
      ordersGrouped[toTargetString] = newValue;
    }
  }
  console.log('ordersGrouped', ordersGrouped);
  return ordersGrouped;
});

/**
 * for each group
 *   use index to place anchor in board square
 *   depending on player, position above top or below bottom
 *   for each entry in group
 *    show newPiecePriority or (+)
 */
const overlayOrders = props.orders.filter((o) => o.type !== 'place');
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
    >
      <span>gg</span>
    </div>
    <BoardPiece
      v-for="piece in props.pieces"
      :data-zug-piece-id="piece.id"
      :key="piece.id"
      :class="{
        selected: props.selectedPieceId === piece.id,
        'board-piece': true,
      }"
      :iconClass="{
        'halo-shadow': Boolean(props.emphasizedPieceIds?.includes(piece.id)),
      }"
      :hints="
        targetingHints && targetingHints.filter((p) => p.pieceID === piece.id)
      "
      v-bind="piece"
      @click.stop="(e) => handlePieceClick(piece.id, e)"
      @mouseover="handlePieceHover(piece.id)"
    >
      <template v-if="props.actionMenuItems[piece.id]" #menu>
        <SpeedDial
          :visible="props.selectedPieceId === piece.id"
          :model="props.actionMenuItems[piece.id]"
          :radius="60"
          type="semi-circle"
          direction="up"
          :tooltipOptions="{ event: undefined, position: 'top' }"
          :style="{
            pointerEvents: 'none',
            left: 'calc(50% - 2rem)',
            bottom: 0,
          }"
        /> </template
    ></BoardPiece>
    <div class="place-overlay"><span>4</span><span>6</span></div>
    <svg v-if="props.showOrders" :width="svgSideLength" :height="svgSideLength">
      <OrderOverlay
        v-for="order in overlayOrders"
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
  display: flex;
  justify-content: center;
  align-items: center;
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

.place-overlay {
  position: absolute;
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

:deep(.p-speeddial-button) {
  pointer-events: none;
  background: transparent;
  color: transparent;
  border: none;
}

:deep(.p-speeddial-action) {
  background-color: white;
}

:deep(.p-speeddial-action:hover) {
  background-color: var(--color-theme-primary);
  color: white;
}

:deep(.p-disabled) {
  opacity: 1;
  background-color: #727272;
}
</style>
