<script setup lang="ts">
import BoardComponent from '../components/BoardComponent.vue';
import { reactive, ref } from 'vue';
import { chessClient, chessClientTwo } from '@/game/App';
import type { GameState } from '@/game/Game';
import type { ClientState } from 'boardgame.io/dist/types/src/client/client';

const gameState = reactive({ G: {} });
const updateGameState = (state: ClientState<{ G: GameState }>) => {
  if (state) {
    gameState.G = state.G;
  } else {
    console.error('A null game state update was received');
  }
};
chessClient.client.subscribe(updateGameState);

const gameStateTwo = reactive({ G: {} });
const updateGameStateTwo = (state: ClientState<{ G: GameState }>) => {
  if (state) {
    gameStateTwo.G = state.G;
  } else {
    console.error('A null game state update was received');
  }
};
chessClientTwo.client.subscribe(updateGameStateTwo);

const playerID = ref(0);
</script>

<template>
  <main>
    <input type="radio" v-model="playerID" :value="1" /> player 1
    <input type="radio" v-model="playerID" :value="2" /> player 2

    <BoardComponent
      v-if="playerID === 1"
      :client="chessClient.client"
      :state="gameState"
    />
    <BoardComponent
      v-if="playerID === 2"
      :client="chessClientTwo.client"
      :state="gameStateTwo"
    />
  </main>
</template>

<style>
main {
  padding: 1rem 0;
}
</style>
