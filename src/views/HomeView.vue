<script setup lang="ts">
import BoardComponent from '../components/BoardComponent.vue';
// @ts-ignore
import { chessClient } from '@/game/App';

const gameState = chessClient.getState();
</script>

<template>
  <main>
    <BoardComponent :state="gameState" />
  </main>
</template>
