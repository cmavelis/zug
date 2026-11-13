<script setup lang="ts">
import BoardComponent from '@/components/BoardComponent.vue';
import { useZugClient } from '@/composables/useZugClient';
import { fullOneMoveTutorial } from '@/game/zugzwang/tutorialGames';
import Content from './howtoplay/tutorial-one.md';

import { computed, watch } from 'vue';
import { useRouter } from 'vue-router';

import Button from 'primevue/button';
import { useMatchHistory } from '@/composables/useMatchHistory';
import TutorialNav from '@/components/TutorialNav.vue';

const router = useRouter();

const boardStateOne = useZugClient('0', fullOneMoveTutorial);
const boardStateTwo = useZugClient('1', fullOneMoveTutorial);

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
const scoringText = computed(() => {
  const score = boardStateOne.gameState.G.score[0];
  let text = `You scored ${score}.`;
  switch (score) {
    case 1:
      text += ' Can you score another?';
      break;
    case 2:
      text += ' Nicely done!';
      break;
    default:
      text += ' Try again!';
  }
  return text;
});
const { boardState, isActiveTurn, replayLastTurn } = useMatchHistory({
  gameState: boardStateOne.gameState,
  matchClientOne: boardStateOne,
});
// TODO: optional show solution button
</script>

<template>
  <TutorialNav />
  <h1 class="layout">Tutorial 1</h1>
  <section class="md-content">
    <Content></Content>
  </section>
  <br />
  <section class="layout">
    <Button
      @click="replayLastTurn()"
      label="Animate moves"
      :disabled="!gameOver"
    />
    <Button
      @click="router.go(0)"
      label="Reset tutorial"
      :disabled="!gameOver"
      severity="secondary"
    ></Button>
    <BoardComponent
      v-if="boardState"
      :client="boardStateOne.client"
      :state="boardState"
      :ctx="boardStateOne.gameState.ctx"
      :config="boardStateOne.gameState.G.config"
      :playerID="boardStateOne.playerID.value"
      :showOrders="boardStateOne.showOrders.value"
      :isActiveTurn="isActiveTurn"
    />
    <h3 v-if="gameOver">{{ scoringText }}</h3>
  </section>
</template>

<style scoped>
.layout {
  text-align: center;
}
</style>
