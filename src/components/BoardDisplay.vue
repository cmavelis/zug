<!-- This should be a re-usable piece combined bak into BoardComponent-->

<script setup lang="ts">
import BoardPiece from '@/components/BoardPiece.vue';
import type { GameState } from '@/game/Game';

import OrderDisplay from '@/components/OrderDisplay.vue';
import { logProxy } from '@/utils';

interface BoardProps {
  state: { G: GameState };
}
const props = defineProps<BoardProps>();
logProxy(props);
</script>

<template>
  <section class="layout">
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
        />
        <svg width="200" height="200">
          <OrderDisplay
            v-for="order in props.state.G.orders[0]"
            :key="order"
            :order="order"
            :G="props.state.G"
          />
          <OrderDisplay
            v-for="order in props.state.G.orders[1]"
            :key="order"
            :order="order"
            :G="props.state.G"
          />
        </svg>
      </div>
    </div>
    <div>
      <p>ORDERS</p>
      <template v-for="playerID in [0, 1]" :key="playerID">
        <p>Player {{ playerID + 1 }}</p>
        <template
          v-for="order in props.state.G.orders[playerID]"
          :key="order.sourcePieceId"
        >
          <p>
            piece {{ order.sourcePieceId }}: {{ order.type }} with vector
            {{ order.toTarget }}
          </p>
        </template>
      </template>
    </div>
  </section>
</template>

<style scoped>
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
