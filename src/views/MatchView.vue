<script setup lang="ts">
import {
  computed,
  reactive,
  ref,
  onMounted,
  onUnmounted,
  watch,
  type Ref,
} from 'vue';
import { useRoute } from 'vue-router';
import OverlayPanel from 'primevue/overlaypanel';

import type { ClientState } from 'boardgame.io/dist/types/src/client/client';
import type { Ctx, FilteredMetadata } from 'boardgame.io/dist/types/src/types';
import { isEqual } from 'lodash';

import BoardComponent from '@/components/BoardComponent.vue';
import BoardDisplay from '@/components/BoardDisplay.vue';
import { useWindowFocus } from '@/composables/useWindowFocus';
import { SimulChessClient } from '@/game/App';
import type { GObject } from '@/game/Game';
import { store } from '@/store';

import { getNotificationSound } from '@/utils/notificationSound';
import {
  startTitleNotification,
  stopTitleNotification,
} from '@/utils/titleAnimation';
import MatchInvite from '@/components/MatchInvite.vue';

const windowHasFocus = useWindowFocus();

watch(windowHasFocus, (newFocus) => {
  if (newFocus) {
    stopTitleNotification();
  }
});

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
const matchData: Ref<FilteredMetadata | undefined> = ref(undefined);
const updateGameState = (state: ClientState<{ G: GObject; ctx: Ctx }>) => {
  matchData.value = matchClientOne.client.matchData;
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

const gamePhase = computed(() => {
  if (gameState.ctx.activePlayers) {
    return gameState.ctx.activePlayers[playerID.value] || '?';
  } else {
    return 'end';
  }
});

const winner = computed(() => {
  if (gameState.ctx.gameover && matchData.value) {
    return matchData.value[gameState.ctx.gameover?.winner].name;
  }
  return false;
});

const opponentWaiting = computed(() => {
  if (!gameState.ctx.activePlayers) {
    return false;
  }
  const opponentPlayerID = playerID.value === 1 ? 0 : 1;
  return gameState.ctx.activePlayers[opponentPlayerID] === 'resolution';
});

const op = ref();
const toggleMatchInfo = (event: Event) => {
  op.value.toggle(event);
};

// "your turn" sound
getNotificationSound(store.zugUsername === 'Ben').then((notificationSound) => {
  const audio = new Audio(notificationSound);
  audio.volume = 0.75;
  watch(
    () => gamePhase.value,
    (newPhase, oldPhase) => {
      if (newPhase !== oldPhase && oldPhase === 'resolution') {
        if (!windowHasFocus.value) {
          audio.play();
          startTitleNotification('Your turn!');
        }
      }
    },
  );
});
</script>

<template>
  <OverlayPanel ref="op" appendTo="body">
    <div>
      <!--prettier-ignore-->
      <pre>{{JSON.stringify(gameState.G.config, null, 2).trim()}}</pre>
    </div>
  </OverlayPanel>
  <main>
    <MatchInvite :matchID="matchID" />
    <p v-if="!isPlayerSelected">Choose a player</p>
    <div class="player-info">
      <span />
      <input
        type="radio"
        v-if="store.isDebug || !isPlayerSelected"
        v-model="playerID"
        :value="0"
      />
      <span :class="{ checked: playerID === 0 }">
        {{ matchData ? matchData[0].name : 'player 1' }}</span
      >
      ({{ gameState.G.score ? gameState.G.score[0] : '?' }}) - ({{
        gameState.G.score ? gameState.G.score[1] : '?'
      }})
      <span :class="{ checked: playerID === 1 }"
        >{{ matchData ? matchData[1].name : 'player 2' }}
      </span>
      <input
        type="radio"
        v-if="store.isDebug || !isPlayerSelected"
        v-model="playerID"
        :value="1"
      />
      <button class="match-info-button" @click="toggleMatchInfo">?</button>
    </div>

    <p v-if="!winner">
      phase:
      {{ gamePhase }}
    </p>
    <p class="game-over" v-else>{{ winner }} wins!</p>

    <p v-if="gamePhase === 'resolution'" class="info-message">
      Waiting for opponent to finish turn...
    </p>
    <p v-if="opponentWaiting" class="info-message">
      Your opponent is waiting for you to finish...
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

.player-info {
  display: grid;
  grid-template-columns: 1fr 100px auto 100px 1fr;
  justify-content: center;
  gap: 0.2rem;
}

.match-info-button {
  --circle-size: 1.8rem;
  background: transparent;
  font-size: 1.2rem;
  font-weight: bold;
  color: var(--color-theme-green);
  border: 2px solid var(--color-theme-green);
  border-radius: var(--circle-size);
  width: var(--circle-size);
  height: var(--circle-size);
}

.match-info-button:hover {
  background-color: var(--color-border-hover);
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

.game-over {
  font-size: 2rem;
  font-weight: bold;
  color: var(--color-theme-green);
}
</style>
