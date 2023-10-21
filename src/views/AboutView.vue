<script setup lang="ts">
import BoardDisplay from '@/components/BoardDisplayV2.vue';

const orderNames = [
  'move-straight',
  // 'move-diagonal',
  // 'push-straight',
  // 'push-diagonal',
];

const orders = [
  {
    type: 'move-straight',
    sourcePieceId: 0,
    toTarget: { x: 0, y: 1 },
    priority: 1,
    owner: 0,
  },
];
const pieces = [
  { id: 0, owner: 0, position: { x: 1, y: 1 }, isDefending: false },
];

const board = { x: 3, y: 3 };
</script>

<template>
  <main class="about">
    <h1>zug</h1>
    <p>
      "zug" is the name of the game. I got it from the first syllable of
      "zugzwang", a German chess term meaning "compulsion to move". A
      fundamental part of the design is that each player is required to use all
      of their pieces each turn. I also thought the name was fitting because the
      moves in this game are similar to chess pawns.
    </p>
    <br />
    <p>
      I decided to make this game as a stepping-stone to a bigger and more
      complicated game that's been brewing in my head for over 10 years. I
      thought I should start and finish a smaller game before trying to tackle
      that one. I feel like it's interesting enough now that I'm committed to
      making it good, not just throwaway practice. I hope you like it!
    </p>
    <br />
    <h2>Order configuration:</h2>
    <section class="grid">
      <template v-for="order in orderNames" :key="order">
        <p>{{ order }}</p>
        <BoardDisplay :pieces="pieces" :board="board" :orders="orders" />
        <p>desc here</p>
      </template>
    </section>
  </main>
</template>

<style>
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
}
</style>
