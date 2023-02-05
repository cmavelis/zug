<script setup lang="ts">
import BoardComponent from '../components/BoardComponent.vue';
import { reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import { SimulChessClient } from '@/game/App';
import type { GameState } from '@/game/Game';
import type { ClientState } from 'boardgame.io/dist/types/src/client/client';
import type { Ctx } from 'boardgame.io/dist/types/src/types';

const playerID = ref(0);
const route = useRoute();
let matchID: string;

if (typeof route.params.matchID === 'string') {
  matchID = route.params.matchID;
} else {
  matchID = route.params.matchID[0];
}
const matchClientOne = new SimulChessClient('0', matchID);
const matchClientTwo = new SimulChessClient('1', matchID);

const gameState = reactive({ G: {}, ctx: {} });
const gameStateLoaded = ref(false);
const updateGameState = (state: ClientState<{ G: GameState; ctx: Ctx }>) => {
  if (state) {
    gameStateLoaded.value = true;
    gameState.G = state.G;
    gameState.ctx = state.ctx;
  } else {
    console.error('A null game state update was received');
  }
};
matchClientOne.client.subscribe(updateGameState);

const gameStateTwo = reactive({ G: {}, ctx: {} });
const gameStateTwoLoaded = ref(false);

const updateGameStateTwo = (state: ClientState<{ G: GameState; ctx: Ctx }>) => {
  if (state) {
    gameStateTwo.G = state.G;
    gameStateTwo.ctx = state.ctx;
    gameStateTwoLoaded.value = true;
  } else {
    console.error('A null game state update was received');
  }
};
matchClientTwo.client.subscribe(updateGameStateTwo);
</script>

<template>
  <main>
    <input type="radio" v-model="playerID" :value="0" /> player 1
    <input type="radio" v-model="playerID" :value="1" /> player 2
    <p>phase: {{ gameState.ctx.activePlayers[playerID] }}</p>

    <BoardComponent
      v-if="playerID === 0 && gameStateLoaded"
      :client="matchClientOne.client"
      :state="gameState"
    />
    <BoardComponent
      v-if="playerID === 1 && gameStateTwoLoaded"
      :client="matchClientTwo.client"
      :state="gameStateTwo"
    />
  </main>
</template>

<style>
main {
  padding: 1rem 0;
}
</style>
