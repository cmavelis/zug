import { computed, ref } from 'vue';
import { isEqual } from 'lodash';
import type { GObject } from '@/game/Game';
import type { SimulChessClient } from '@/game/App';
import type { ReactiveGameState } from '@/views/MatchView.vue';

interface MatchHistoryProps {
  gameState: ReactiveGameState;
  route?: any;
  matchClientOne: SimulChessClient;
}

export function useMatchHistory({
  gameState,
  route,
  matchClientOne,
}: MatchHistoryProps) {
  const historyTurn = ref<number>(
    route?.query?.turn ? Number(route.query.turn) : 1,
  );
  function incrementHistoryTurn() {
    historyTurn.value++;
    setHistoryStep(1);
  }
  function decrementHistoryTurn() {
    historyTurn.value--;
    setHistoryStep(1);
  }
  function setHistoryTurn(turn: number) {
    historyTurn.value = turn;
  }
  function setHistoryLastTurn() {
    setHistoryTurn(gameState.G.history.length + 1);
    setHistoryStep(1);
  }

  const sleep = (delay: number) =>
    new Promise((resolve) => setTimeout(resolve, delay));
  async function animateTurn(startTurn: number) {
    while (historyTurn.value === startTurn) {
      await sleep(800);
      incrementHistoryStep();
    }
  }
  function replayLastTurn() {
    matchClientOne.client.moves.markTurnSeen();
    setHistoryTurn(gameState.G.history.length);
    animateTurn(gameState.G.history.length);
  }

  const gameLastTurn = computed(() => {
    if (isEqual(gameState.G, {})) {
      return null;
    }
    const { history } = gameState.G as GObject;
    if (history.length > 0) {
      return history[historyTurn.value - 1];
    }
    return null;
  });
  const historyTurnStep = ref(
    route?.query?.step ? Number(route.query.step) : 1,
  );
  function incrementHistoryStep() {
    if (gameLastTurn.value && historyTurnStep.value < gameLastTurn.value.length)
      historyTurnStep.value++;
    else if (
      gameLastTurn.value &&
      historyTurnStep.value >= gameLastTurn.value.length &&
      historyTurn.value <= gameState.G.history.length
    ) {
      historyTurn.value++;
      historyTurnStep.value = 1;
    }
  }
  function decrementHistoryStep() {
    if (historyTurnStep.value > 1) historyTurnStep.value--;
    else if (historyTurnStep.value === 1 && historyTurn.value > 1) {
      historyTurn.value--;
      historyTurnStep.value = gameState.G.history[historyTurn.value - 1].length;
    }
  }
  function setHistoryStep(value: number) {
    historyTurnStep.value = value;
  }

  const isActiveTurn = computed(() => {
    const { history } = gameState.G as GObject;

    return history && historyTurn.value > history.length;
  });

  const boardState = computed(() => {
    if (isActiveTurn.value) {
      return gameState.G;
    }
    if (gameLastTurn.value) {
      return gameLastTurn.value[historyTurnStep.value - 1];
    }
    return null;
  });

  return {
    boardState,
    gameLastTurn,
    isActiveTurn,
    historyTurn,
    historyTurnStep,
    animateTurn,
    incrementHistoryStep,
    incrementHistoryTurn,
    decrementHistoryStep,
    decrementHistoryTurn,
    setHistoryStep,
    setHistoryLastTurn,
    replayLastTurn,
  };
}
