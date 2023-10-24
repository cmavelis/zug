<script setup lang="ts">
import BoardDisplay from '@/components/BoardDisplayV2.vue';
import type { ConfigOrderType } from '@/game/zugzwang/validators';
import { getValidSquaresForOrder } from '@/game/zugzwang/validators';
import { ORDER_PRIORITIES } from '@/game/orders';
import { coordinatesToArray } from '@/game/common';
import type { Order } from '@/game/orders';

type OrdersHere = Exclude<ConfigOrderType, 'attack' | 'place'>;

const orderNames: OrdersHere[] = [
  'move-straight',
  'move-diagonal',
  'push-straight',
  'push-diagonal',
];

const position = { x: 1, y: 1 };

const pieces = [{ id: 0, owner: 0, position, isDefending: false }];

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
    <h2>Basics</h2>
    <section class="text">
      <p>
        The goal of the game is to advance one of your pieces to the opponent's
        side 4 times. During each turn, both players are creating a list of
        "orders" that their pieces will execute in the order they were assigned.
        Each piece must take one action per turn, and each action must only be
        assigned once. When both players assign all their orders and end their
        "planning" phase, the game will resolve the orders from both players and
        generate a new board state. This signals the start of a new turn.
        <br /><br />
        During "resolution", the list of orders from both players are applied
        step-by-step. During each step, actions will occur in "priority" order
        (1=highest priority). I've added a "last turn" viewer that you can use
        to step through how the previous turn was resolved, which should help
        clarify this process.
        <br /><br />
        If a piece is on the opponent's home row at the end of the turn, then it
        will be scored and removed from play. It may be placed back on the board
        just like a destroyed piece, by using the "place" action.
      </p>
    </section>
    <h2>Orders</h2>
    <p class="text">
      These are the currently configured orders in the game, showing all
      possible directions you can assign them.
    </p>
    <section class="grid">
      <template v-for="order in orderNames" :key="order">
        <p>{{ order }}</p>
        <BoardDisplay
          :pieces="pieces"
          :board="board"
          :orders="ordersDict[order]"
        />
        <div>
          <p>priority: {{ ORDER_PRIORITIES[order] }}</p>
          <p v-if="order === 'move-straight'">
            "move" actions are designed to always advance toward the opponent's
            side. If the target square of a "move" action is occupied when it's
            supposed to occur, nothing happens.
          </p>
          <p v-if="order === 'push-straight'">
            "push" actions leave the acting piece in place. This action pushes a
            piece on the target square away, along with any others in the path.
            Think of a sliding puzzle. Any pieces pushed off the board are
            destroyed.
          </p>
        </div>
      </template>
      <p>place</p>
      <BoardDisplay
        :pieces="[]"
        :orders="[]"
        :board="{ x: 4, y: 4 }"
        :highlighted-cells="placeActionSquares"
      />
      <div>
        <p>priority: {{ ORDER_PRIORITIES.place }}</p>
        <p>
          For each of your pieces that are missing, you may place a new piece on
          your home row during your turn. If there is a piece in that square,
          <strong>both will be destroyed!</strong>
        </p>
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
  grid-template-columns: 1fr 1fr 1fr;
  row-gap: 1rem;
}
.text {
  max-width: 800px;
  margin: 0 auto;
  padding-bottom: 1rem;
}
</style>
