<script setup lang="ts">
import { ref } from 'vue';
import type { Ref } from 'vue';
import type { _ClientImpl } from 'boardgame.io/dist/types/src/client/client';
import BoardPiece from '@/components/BoardPiece.vue';
import type { GameState } from '@/game/Game';
import type { Order, OrderTypes } from '@/game/orders';
import { arrayToCoordinates, getDisplacement } from '@/game/common';
import { createOrder } from '@/game/orders';

import OrderDisplay from '@/components/OrderDisplay.vue';

// TODO: display-only board, no client prop
interface BoardProps {
  client: _ClientImpl<GameState>;
  state: { G: GameState };
  playerID: number;
}

const selectedPiece: Ref<null | number> = ref(null);
const selectedAction: Ref<null | OrderTypes> = ref(null);
const cellHover: Ref<null | number> = ref(null);

const props = defineProps<BoardProps>();

const addOrder = (order: Order) => {
  props.client.moves.addOrder(order);
};

const handlePieceClick = (id: number) => {
  if (typeof selectedPiece.value !== 'number') {
    selectedPiece.value = id;
  }
};

const getPieceCoords = (pieceID: number, G: GameState) => {
  const piece = G.pieces.find((p) => p.id === pieceID);
  if (!piece) {
    throw Error(`Could not find piece with ID: ${pieceID}`);
  }
  return piece.position;
};

// select piece, then action, then cell
const handleCellClick = (pieceID?: number) => {
  if (selectedPiece.value === null && typeof pieceID === 'number') {
    handlePieceClick(pieceID);
    return;
  }
  if (
    typeof selectedPiece.value === 'number' &&
    selectedAction.value &&
    typeof cellHover.value === 'number'
  ) {
    const pieceCoords = getPieceCoords(selectedPiece.value, props.state.G);
    const targetCoords = arrayToCoordinates(
      cellHover.value,
      props.state.G.board
    );

    const toTarget = getDisplacement(pieceCoords, targetCoords);
    const order = createOrder(
      {
        sourcePieceId: selectedPiece.value,
        toTarget,
      },
      selectedAction.value
    );
    addOrder(order);
    clearAction();
  }
};

const handleCellHover = (cellId: number) => {
  cellHover.value = cellId;
};

const handleEndTurn = () => {
  const { endStage } = props.client.events;
  if (endStage) endStage();
};

const selectAction = (action: OrderTypes) => {
  selectedAction.value = action;
};

const clearAction = () => {
  selectedAction.value = null;
  selectedPiece.value = null;
};

const undoLastOrder = () => {
  props.client.moves.removeLastOrder();
};
</script>

<template>
  <section class="layout">
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
        <svg width="200" height="200">
          <OrderDisplay
            v-for="order in props.state.G.orders[props.playerID]"
            :key="order"
            :order="order"
            :G="props.state.G"
          />
        </svg>
      </div>
      <div class="order-button-group">
        <button @click="selectAction('move-straight')">move (straight)</button>
        <button @click="selectAction('push-straight')">push (straight)</button>
        <button @click="selectAction('move-diagonal')">move (diagonal)</button>
        <button @click="selectAction('push-diagonal')">push (diagonal)</button>
        <button @click="clearAction()">clear</button>
      </div>
    </div>
    <div>
      <p>
        piece:
        {{
          typeof selectedPiece === 'number'
            ? String(selectedPiece)
            : 'none selected'
        }}
      </p>
      <p>action: {{ selectedAction || 'none selected' }}</p>
      <p>ORDERS</p>
      <template
        v-for="order in props.state.G.orders[client.playerID]"
        :key="order.sourcePieceId"
      >
        <p>
          piece {{ order.sourcePieceId }}: {{ order.type }} with vector
          {{ order.toTarget }}
        </p>
      </template>
      <button @click="undoLastOrder()">undo last order</button>
      <button @click="handleEndTurn">end turn</button>
    </div>
  </section>
  <!--  <p>{{ props.state }}</p>-->
</template>

<style scoped>
button {
  -webkit-appearance: none;
  min-height: 2.5rem;
}

.layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
}
.board-wrapper {
  --square-size: 50px;
  position: relative;
  display: flex;
  flex-direction: row;
  justify-content: center;
  gap: 8px;
}

.board-container {
  display: grid;
  grid-template-columns: repeat(4, var(--square-size));
  grid-template-rows: repeat(4, var(--square-size));
  border: 1px solid blanchedalmond;
  width: fit-content;
  height: fit-content;
}

.board-square {
  border: 1px solid blanchedalmond;
  z-index: 3; /* want this above the order overlay for hover events */
}

.hoveredCell {
  box-shadow: inset 0 0 5px cyan, inset 0 0 10px cyan;
}

.order-button-group {
  display: flex;
  flex-direction: column;
}

section {
  display: flex;
  flex-direction: row;
  justify-content: space-evenly;
  padding: 1rem;
}

.selected {
  box-shadow: 0 0 10px coral, 0 0 5px coral;
}

svg {
  position: absolute;
  z-index: 2;
}
</style>
