<script setup lang="ts">
import { computed, reactive, ref, onMounted, onUnmounted, watch } from 'vue';
import { useRoute } from 'vue-router';

import type { ClientState } from 'boardgame.io/dist/types/src/client/client';
import type { Ctx } from 'boardgame.io/dist/types/src/types';
import { isEqual } from 'lodash';

import BoardComponent from '@/components/BoardComponent.vue';
import BoardDisplay from '@/components/BoardDisplay.vue';
import { useWindowFocus } from '@/composables/useWindowFocus';
import { SimulChessClient } from '@/game/App';
import type { GObject } from '@/game/Game';
import { store } from '@/store';

import notificationSound from '../assets/two-note-notification.mp3';

const windowHasFocus = useWindowFocus();

watch(windowHasFocus, (newFocus) => {
  if (newFocus) {
    stopTitleNotification();
  }
});

// START useWindowTitle
const originalDocumentTitle = document.title;
let interval1: string | number | NodeJS.Timeout | undefined,
  interval2: string | number | NodeJS.Timeout | undefined;

const startTitleNotification = () => {
  interval1 = setInterval(() => {
    document.title = 'Your turn!';
  }, 2500);
  setTimeout(() => {
    interval2 = setInterval(() => {
      document.title = originalDocumentTitle;
    }, 2500);
  }, 1250);
};

const stopTitleNotification = () => {
  clearInterval(interval1);
  clearInterval(interval2);
};
// END useWindowTitle

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

/**
 * TODO: allow side-by-side clients in testing matches or while spectating (playerID=null)
 */
const matchClientOne = new SimulChessClient(
  String(playerID.value),
  matchID,
  store.zugToken,
);

watch(playerID, () => {
  matchClientOne.client.updatePlayerID(String(playerID.value));
});

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
    console.warn('A null game state update was received');
  }
};
matchClientOne.client.subscribe(updateGameState);

const historyTurn = ref(1);
function incrementHistoryTurn() {
  historyTurn.value++;
}
function decrementHistoryTurn() {
  historyTurn.value--;
}
function setHistoryLastTurn() {
  historyTurn.value = gameState.G.history.length;
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
const historyTurnStep = ref(1);
function incrementHistoryStep() {
  historyTurnStep.value++;
}
function decrementHistoryStep() {
  historyTurnStep.value--;
}
function setHistoryStep(value: number) {
  historyTurnStep.value = value;
}

// new turn watcher
watch(
  () => gameState.G.history,
  async (newHistory, oldHistory) => {
    if (newHistory && oldHistory && newHistory?.length !== oldHistory?.length) {
      historyTurnStep.value = 1;
      setHistoryLastTurn();
    }
  },
);

// TODO: add something like this to show ooponent phase
const gamePhase = computed(() => {
  if (gameState.ctx.activePlayers) {
    return gameState.ctx.activePlayers[playerID.value] || '?';
  } else {
    return 'end';
  }
});

// "your turn" sound
const audio = new Audio(notificationSound);
audio.volume = 0.75;
watch(
  () => gamePhase.value,
  (newPhase, oldPhase) => {
    if (newPhase !== oldPhase && oldPhase === 'resolution') {
      if (!windowHasFocus.value) {
        audio.play();
        startTitleNotification();
      }
    }
  },
);
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
      v-if="gameStateLoaded"
      :client="matchClientOne.client"
      :state="gameState"
      :playerID="playerID"
      :showOrders="isPlayerSelected"
    />
    <div v-if="gameLastTurn">
      <button @click="historyTurn = 1">
        {{ '|<' }}
      </button>
      <button :disabled="historyTurn <= 1" @click="decrementHistoryTurn()">
        -
      </button>
      <span id="history-order-number-display">{{ historyTurn }}</span>
      <button
        :disabled="historyTurn >= gameState.G.history.length"
        @click="incrementHistoryTurn()"
      >
        +
      </button>
      <button @click="setHistoryLastTurn()">>|</button>
      <div>TURN {{ historyTurn }}</div>
      <button @click="setHistoryStep(1)">
        {{ '|<' }}
      </button>
      <button :disabled="historyTurnStep <= 1" @click="decrementHistoryStep()">
        -
      </button>
      <span id="history-order-number-display">{{ historyTurnStep }}</span>
      <button
        :disabled="historyTurnStep >= gameLastTurn.length"
        @click="incrementHistoryStep()"
      >
        +
      </button>
      <button @click="setHistoryStep(gameLastTurn.length)">>|</button>

      <BoardDisplay
        :state="{ G: gameLastTurn[historyTurnStep - 1] }"
        :orderNumber="historyTurnStep"
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
