<script setup lang="ts">
import BoardComponent from '../components/BoardComponent.vue';
import { reactive } from 'vue';
// @ts-ignore
import { chessClient } from '@/game/App';
import type { IGameState } from '@/game/Game';
const gameState = reactive({ G: {} });

const updateGameState = (args: { G: IGameState }) => {
  gameState.G = args.G;
};

chessClient.client.subscribe(updateGameState);
</script>

<template>
  <main>
    <BoardComponent :state="gameState" />
  </main>
</template>
