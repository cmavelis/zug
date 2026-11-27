<script setup lang="ts">
import BoardComponent from '@/components/BoardComponent.vue';
import { useZugClient } from '@/composables/useZugClient';
import { blockAndScoreTutorial } from '@/game/zugzwang/tutorialGames';
import Content from './howtoplay/tutorial-two.md';

import { computed, watch } from 'vue';
import { useRouter } from 'vue-router';

import Button from 'primevue/button';
import { useMatchHistory } from '@/composables/useMatchHistory';
import TutorialNav from '@/components/TutorialNav.vue';
import { useTutorialSolution } from '@/composables/useTutorialSolution';
import SolutionContent from '@/views/howtoplay/tutorial-two-solution.md';

const router = useRouter();

const boardStateOne = useZugClient('0', blockAndScoreTutorial);
const boardStateTwo = useZugClient('1', blockAndScoreTutorial);

// automatically end turn for empty player 2 slot
watch(boardStateOne.gameState, (gameState) => {
  const { ctx } = gameState;
  if (!ctx.activePlayers) {
    return;
  }
  if (ctx.activePlayers[0] == 'resolution') {
    boardStateTwo.client.moves.endTurn();
  }
});

const gameOver = computed(() => boardStateOne.gameState.ctx.gameover);
const scoringText = computed(() => {
  const score = boardStateOne.gameState.G.score[0];
  const oppScore = boardStateOne.gameState.G.score[1];
  let text = `You scored ${score}. The opponent scored ${oppScore}.`;

  if (oppScore == 0) {
    text += '\nNice block.';
  } else {
    text += '\nTry to find a way to block your opponent from scoring.';
  }
  if (score == 0) {
    text += '\nCan you see a way to score?';
  }

  return text;
});
const { boardState, isActiveTurn, replayLastTurn } = useMatchHistory({
  gameState: boardStateOne.gameState,
  matchClientOne: boardStateOne,
});
const { showSolution, handleShowSolution } = useTutorialSolution(
  boardStateOne,
  'a2mSW,a3pSW,a4mS,a5pS',
);
</script>

<template>
  <TutorialNav />
  <section class="md-content">
    <h1 class="layout">Tutorial 2</h1>
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
    <Button @click="handleShowSolution()" label="Show solution"></Button>
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
    <section v-if="showSolution" class="md-content">
      <SolutionContent></SolutionContent>
    </section>
    <h3 v-if="gameOver">{{ scoringText }}</h3>
  </section>
</template>

<style scoped>
.layout {
  text-align: center;
}
</style>
