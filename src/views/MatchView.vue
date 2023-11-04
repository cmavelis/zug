<script setup lang="ts">
import { computed, reactive, ref, onMounted, onUnmounted, watch } from 'vue';
import { useRoute } from 'vue-router';

import type { ClientState } from 'boardgame.io/dist/types/src/client/client';
import type { Ctx } from 'boardgame.io/dist/types/src/types';
import { isEqual } from 'lodash';

import BoardComponent from '@/components/BoardComponent.vue';
import BoardDisplay from '@/components/BoardDisplay.vue';
import { SimulChessClient } from '@/game/App';
import type { GameState, GObject } from '@/game/Game';
import { store } from '@/store';

onMounted(() => {
  window.addEventListener('keydown', keyListener);
});

onUnmounted(() => {
  window.removeEventListener('keydown', keyListener);
});

interface ReactiveGameState {
  G: GObject;
  ctx: Ctx;
}

const route = useRoute();
let playerIDDefault = -1;

if (route.query.player) {
  if ([1, 2].includes(Number(route.query.player))) {
    playerIDDefault = Number(route.query.player) - 1;
  } else {
    store.setIsDebug();
  }
}
const playerID = ref(playerIDDefault);
const isPlayerSelected = computed(() => {
  return playerID.value === 0 || playerID.value === 1;
});
const keyListener = (event: KeyboardEvent) => {
  // @ts-expect-error tagname DNE
  if (event?.target?.tagName?.toLowerCase() === 'input') {
    return;
  }
  switch (event.key) {
    case '1': {
      if (store.isDebug) playerID.value = 0;
      break;
    }
    case '2': {
      if (store.isDebug) playerID.value = 1;
      break;
    }
    default:
      break;
  }
};

let matchID: string;

if (typeof route.params.matchID === 'string') {
  matchID = route.params.matchID;
} else {
  matchID = route.params.matchID[0];
}
const matchClientOne = new SimulChessClient('0', matchID);
const matchClientTwo = new SimulChessClient('1', matchID);

const gameState: ReactiveGameState = reactive({
  G: {} as GObject,
  ctx: {} as Ctx,
});
const gameStateLoaded = ref(false);
const updateGameState = (state: ClientState<{ G: GObject; ctx: Ctx }>) => {
  if (state) {
    gameStateLoaded.value = true;
    gameState.G = state.G as unknown as GObject;
    gameState.ctx = state.ctx;
  } else {
    console.error('A null game state update was received');
  }
};
matchClientOne.client.subscribe(updateGameState);

const gameLastTurn = computed(() => {
  if (isEqual(gameState.G, {})) {
    return null;
  }
  const { history } = gameState.G as GObject;
  if (history.length > 0) {
    return history[history.length - 1];
  }
  return null;
});
const historyOrderNumber = ref(1);
function incrementHistory() {
  historyOrderNumber.value++;
}
function decrementHistory() {
  historyOrderNumber.value--;
}

const gameStateTwo = reactive({ G: {} as GameState, ctx: {} as Ctx });
const gameStateTwoLoaded = ref(false);

const updateGameStateTwo = (state: ClientState<{ G: GameState; ctx: Ctx }>) => {
  if (state) {
    gameStateTwo.G = state.G as unknown as GameState;
    gameStateTwo.ctx = state.ctx;
    gameStateTwoLoaded.value = true;
  } else {
    console.error('A null game state update was received');
  }
};
matchClientTwo.client.subscribe(updateGameStateTwo);

watch(
  () => gameState.G.history,
  async (newHistory, oldHistory) => {
    if (newHistory.length !== oldHistory.length) {
      historyOrderNumber.value = 1;
    }
  },
);

const gamePhase = computed(() => {
  if (gameState.ctx.activePlayers) {
    return gameState.ctx.activePlayers[playerID.value] || '?';
  } else {
    return 'end';
  }
});
</script>

<template>
  <main>
    <p v-if="!isPlayerSelected">Choose a player</p>
    <input
      type="radio"
      v-if="store.isDebug || !isPlayerSelected"
      v-model="playerID"
      :value="0"
    />
    <span :class="{ checked: playerID === 0 }"> player 1</span> ({{
      gameState.G.score ? gameState.G.score[0] : '?'
    }}) - ({{ gameState.G.score ? gameState.G.score[1] : '?' }})
    <span :class="{ checked: playerID === 1 }">player 2 </span>
    <input
      type="radio"
      v-if="store.isDebug || !isPlayerSelected"
      v-model="playerID"
      :value="1"
    />
    <p>
      phase:
      {{ gamePhase }}
    </p>
    <p v-if="gamePhase === 'resolution'" class="info-message">
      Waiting for opponent to finish turn...
    </p>
    <BoardComponent
      v-if="playerID !== 1 && gameStateLoaded"
      :client="matchClientOne.client"
      :state="gameState"
      :playerID="playerID"
      :showOrders="isPlayerSelected"
    />
    <BoardComponent
      v-if="playerID === 1 && gameStateTwoLoaded"
      :client="matchClientTwo.client"
      :state="gameStateTwo"
      :playerID="playerID"
      :showOrders="isPlayerSelected"
    />
    <div v-if="gameLastTurn">
      <div>LAST TURN</div>
      <button :disabled="historyOrderNumber <= 1" @click="decrementHistory()">
        -
      </button>
      <span id="history-order-number-display">{{ historyOrderNumber }}</span>
      <button
        :disabled="historyOrderNumber >= gameLastTurn.length"
        @click="incrementHistory()"
      >
        +
      </button>

      <BoardDisplay
        :state="{ G: gameLastTurn[historyOrderNumber - 1] }"
        :orderNumber="historyOrderNumber"
      />
    </div>
  </main>
</template>

<style>
main {
  padding: 1rem 0;
}

.info-message {
  color: coral;
}

#history-order-number-display {
  display: inline-block;
  width: 2rem;
}

.checked {
  color: var(--color-theme-green);
  font-weight: bold;
}
</style>
