<script setup lang="ts">
import BoardComponent from '../components/BoardComponent.vue';
import { reactive } from 'vue';
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
</script>

<template>
  <main>
    <BoardComponent :client="chessClient.client" :state="gameState" />
    <BoardComponent :client="chessClientTwo.client" :state="gameStateTwo" />
  </main>
</template>

<style>
main {
  padding: 1rem 0;
}
</style>
