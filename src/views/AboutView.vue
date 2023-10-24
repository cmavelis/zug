<script setup lang="ts">
import BoardDisplay from '@/components/BoardDisplayV2.vue';
import {
  ConfigOrderType,
  getValidSquaresForOrder,
} from '@/game/zugzwang/validators';
import { ORDER_PRIORITIES } from '@/game/orders';
import { coordinatesToArray } from '@/game/common';

const orderNames: ConfigOrderType[] = [
  'move-straight',
  'move-diagonal',
  'push-straight',
  'push-diagonal',
];

const position = { x: 1, y: 1 };

const pieces = [{ id: 0, owner: 0, position, isDefending: false }];

const board = { x: 3, y: 3 };
const fullBoard = { x: 4, y: 4 };

let ordersDict = {};

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
    <section class="text">
      <h1>zug</h1>
      <p>
        "zug" is the name of the game. I got it from the first syllable of
        <a href="https://en.m.wikipedia.org/wiki/Zugzwang">"zugzwang"</a>, a
        German term I learned from chess, meaning "compulsion to move". A
        fundamental part of the design is that each player is required to use
        all of their pieces each turn. I also thought the name was fitting
        because the moves in this game are similar to chess pawns.
      </p>
      <br />
      <p>
        I first decided to make this game as a stepping-stone to a bigger and
        more complicated game that's been brewing in my head for over 10 years.
        Now, I feel like it's interesting enough that I'm committed to making it
        good in its own right before moving on. I hope you like it!
      </p>
    </section>
    <br />
    <h2>Order configuration:</h2>
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
}
</style>
