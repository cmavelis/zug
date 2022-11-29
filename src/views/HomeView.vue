<script setup lang="ts">
import BoardComponent from '../components/BoardComponent.vue';
import { reactive } from 'vue';
import { chessClient } from '@/game/App';
import type { GameState } from '@/game/Game';
import type { ClientState } from 'boardgame.io/dist/types/src/client/client';
const gameState = reactive({ G: {} });

const updateGameState = (state: ClientState<{ G: GameState }>) => {
  if (state) {
    gameState.G = state.G;
  } else {
    console.error('A null game state update was recieved');
  }
};

chessClient.client.subscribe(updateGameState);
</script>

<template>
  <main>
    <BoardComponent :state="gameState" />
  </main>
</template>
