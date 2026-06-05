<script setup lang="ts">
import BoardComponent from '@/components/BoardComponent.vue';
import { useZugClient } from '@/composables/useZugClient';
import { oneMoveTutorial } from '@/game/zugzwang/tutorialGames';
import { watch } from 'vue';

const boardStateOne = useZugClient('0', oneMoveTutorial);
const boardStateTwo = useZugClient('1', oneMoveTutorial);

// automatically end turn for empty player 2 slot
watch(boardStateOne.gameState, (gameState) => {
  const { ctx } = gameState;
  if (!ctx.activePlayers) {
    return;
  }
  if (ctx.activePlayers[1] == 'planning') {
    boardStateTwo.client.moves.endTurn();
  }
});
</script>

<template>
  <BoardComponent
    :client="boardStateOne.client"
    :state="boardStateOne.gameState.G"
    :ctx="boardStateOne.gameState.ctx"
    :config="boardStateOne.gameState.G.config"
    :playerID="boardStateOne.playerID.value"
    :showOrders="boardStateOne.showOrders.value"
    :isActiveTurn="boardStateOne.isActiveTurn"
  />
</template>

<style scoped></style>
