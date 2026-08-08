<script setup lang="ts">
import BoardComponent from '@/components/BoardComponent.vue';
import { useZugClient } from '@/composables/useZugClient';
import { oneMoveScoringTutorial } from '@/game/zugzwang/tutorialGames';
import { computed, watch } from 'vue';

const boardStateOne = useZugClient('0', oneMoveScoringTutorial);
const boardStateTwo = useZugClient('1', oneMoveScoringTutorial);

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

const gameOver = computed(() => boardStateOne.gameState.ctx.gameover);
const isActiveTurn = computed(
  () => boardStateOne.isActiveTurn && !gameOver.value,
);
</script>

<template>
  <section class="layout">
    <p>In this tutorial, you have two pieces with different "priority".</p>
    <p>A piece with a 1 will move before a piece with a 2</p>
    <p></p>
    <p v-if="gameOver">
      Are you able to score a point? Try to combine a push and move command to
      get a piece to the back row
    </p>
    <br v-else />
    <BoardComponent
      :client="boardStateOne.client"
      :state="boardStateOne.gameState.G"
      :ctx="boardStateOne.gameState.ctx"
      :config="boardStateOne.gameState.G.config"
      :playerID="boardStateOne.playerID.value"
      :showOrders="boardStateOne.showOrders.value"
      :isActiveTurn="isActiveTurn"
    />
  </section>
</template>

<style scoped>
p {
  margin: 0 auto;
  max-width: 800px;
}
</style>
