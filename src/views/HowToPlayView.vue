<script setup lang="ts">
import { BoardDisplayV2 as BoardDisplay } from '@/components/BoardDisplay';
import type { ConfigOrderType } from '@/game/zugzwang/validators';
import { getValidSquaresForOrder } from '@/game/zugzwang/validators';
import { ORDER_PRIORITIES } from '@/game/orders';
import { coordinatesToArray } from '@/game/common';
import type { Order } from '@/game/orders';

import Content from './howtoplay/howtoplay.mdx';

type OrdersHere = Exclude<ConfigOrderType, 'attack' | 'place'>;

const orderNames: OrdersHere[] = [
  'move-straight',
  'move-diagonal',
  'push-straight',
  'push-diagonal',
];

const position = { x: 1, y: 1 };

const pieces = [
  { id: 0, owner: 0 as 0 | 1, position, isDefending: false, priority: 0 },
];

const board = { x: 3, y: 3 };
const fullBoard = { x: 4, y: 4 };

type OrdersDict = { [OrderName in OrdersHere]: Order[] };
let ordersDict: OrdersDict = {} as OrdersDict;

orderNames.forEach((name) => {
  ordersDict[name] = getValidSquaresForOrder({
    playerID: 0,
    board,
    orderType: name,
  }).map((coord) => ({
    type: name,
    sourcePieceId: 0,
    toTarget: coord,
    priority: 1,
    owner: 0,
  }));
});

const placeActionSquares = getValidSquaresForOrder({
  playerID: 0,
  board: fullBoard,
  orderType: 'place',
}).map((coord) => coordinatesToArray(coord, fullBoard));
</script>

<template>
  <main class="about">
    <h1>How To Play</h1>
    <Content />
    <br />
    <hr />
    <br />
    <section>
      <h2>Actions Reference</h2>
      <p class="text">
        These are the currently configured actions in the game, showing all
        possible directions you can assign them.
      </p>
      <div class="grid">
        <template v-for="order in orderNames" :key="order">
          <div class="grid-left">
            <p>{{ order }}</p>
            <BoardDisplay
              :pieces="pieces"
              :board="board"
              :orders="ordersDict[order]"
            />
          </div>
          <div>
            <p>priority: {{ ORDER_PRIORITIES[order] }}</p>
            <p v-if="order === 'move-straight'">
              "move" actions are designed to always advance toward the
              opponent's side. If the target square of a "move" action is
              occupied when it's supposed to occur, nothing happens.
            </p>
            <p v-if="order === 'push-straight'">
              "push" actions leave the acting piece in place. This action pushes
              a piece on the target square away, along with any others in the
              path. Think of a sliding puzzle. Any pieces pushed off the board
              are destroyed.
            </p>
          </div>
        </template>
        <div class="grid-left">
          <p>place</p>
          <BoardDisplay
            :pieces="[]"
            :orders="[]"
            :board="{ x: 4, y: 4 }"
            :highlighted-cells="placeActionSquares"
          />
        </div>
        <div>
          <p>priority: {{ ORDER_PRIORITIES.place }}</p>
          <p>
            For each of your pieces that are missing, you may place a new piece
            on your home row during your turn. If there is a piece in that
            square,
            <strong>both will be destroyed!</strong>
          </p>
        </div>
      </div>
    </section>
  </main>
</template>

<style>
strong {
  font-weight: bold;
}
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  row-gap: 1rem;
}
.grid-left {
  display: grid;
  align-items: center;
  justify-content: center;
}
.text {
  max-width: 800px;
  margin: 0 auto;
  padding-bottom: 1rem;
}
ul {
  font-size: 1.2rem;
  max-width: 500px;
  text-align: left;
  margin: 0 auto;
}

strong {
  color: var(--primary-color);
}

li > .pi,
li > .zi {
  color: var(--primary-color);
}

.pi {
  padding: 4px;
}
</style>
