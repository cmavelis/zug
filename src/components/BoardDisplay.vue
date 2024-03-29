<!-- This should be a re-usable piece combined bak into BoardComponent-->

<script setup lang="ts">
import BoardPiece from '@/components/BoardPiece.vue';
import type { GameState } from '@/game/Game';

import OrderDisplay from '@/components/OrderOverlay.vue';
import { BOARD_PIXEL_SIZE } from '@/constants';

interface BoardProps {
  state: { G: Omit<GameState, 'config'> };
  orderNumber?: number;
}
const props = defineProps<BoardProps>();
const svgSideLength = BOARD_PIXEL_SIZE * 6;
const svgOriginOffset = BOARD_PIXEL_SIZE;
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
          :key="piece.id"
          v-bind="piece"
        />

        <div class="svg-anchor">
          <svg :width="svgSideLength" :height="svgSideLength">
            <OrderDisplay
              v-for="order in props.state.G.orders[0]"
              :key="order.toString()"
              :order="order"
              :pieces="props.state.G.pieces"
              :svgOffset="svgOriginOffset"
            />
            <OrderDisplay
              v-for="order in props.state.G.orders[1]"
              :key="order.toString()"
              :order="order"
              :pieces="props.state.G.pieces"
              :svgOffset="svgOriginOffset"
            />
            <!--          different from BoardComponent-->
            <OrderDisplay
              v-for="event in props.state.G.events"
              :key="event.toString()"
              :order="event"
              :pieces="props.state.G.pieces"
              :svgOffset="svgOriginOffset"
            />
          </svg>
        </div>
      </div>
    </div>
    <div v-if="props.orderNumber">
      <p>Turn step: {{ props.orderNumber }}</p>
      <p>score: {{ props.state.G.score[0] }} - {{ props.state.G.score[1] }}</p>
      <p>ACTIONS</p>
      <template
        v-for="event in props.state.G.events"
        :key="event.sourcePieceId"
      >
        <p>piece {{ event.sourcePieceId }}: {{ event.type }}!</p>
      </template>
      <template v-for="playerID in [0, 1]" :key="playerID">
        <p>Player {{ playerID + 1 }}</p>
        <template
          v-for="order in props.state.G.orders[playerID]"
          :key="order.sourcePieceId"
        >
          <p>
            piece {{ order.sourcePieceId }}: {{ order.type }} with vector
            {{ order.toTarget || 'n/a' }}
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

section {
  display: flex;
  flex-direction: row;
  justify-content: space-evenly;
  padding: 1rem;
}

.svg-anchor {
  position: absolute;
  height: 0;
  width: 0;
}

svg {
  position: relative;
  z-index: 2;
  top: calc(-1 * var(--square-size));
  left: calc(-1 * var(--square-size));
}
</style>
