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

import type { ClientState } from 'boardgame.io/dist/types/src/client/client';
import type { Ctx, FilteredMetadata } from 'boardgame.io/dist/types/src/types';
import { isEqual } from 'lodash';
import Button from 'primevue/button';
import { useToast } from '@/composables/useToast';
import { useErrorHandler } from '@/composables/useErrorHandler';
import axios from 'axios';

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
import LoginComponent from '@/components/LoginComponent.vue';
import { useMatch } from '@/composables/useMatch';
import { LobbyClient } from 'boardgame.io/client';
import { getServerURL } from '@/utils';
import ButtonStepper from '@/components/ButtonStepper.vue';

const windowHasFocus = useWindowFocus();
const toast = useToast();
const { handleError } = useErrorHandler();

const server = getServerURL();
const lobbyClient = new LobbyClient({ server });
const { joinStatus, requestJoinMatch } = useMatch(lobbyClient);

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
let playerIDDefault: number | null = null;

if (route.query.player) {
  if ([1, 2].includes(Number(route.query.player))) {
    playerIDDefault = Number(route.query.player) - 1;
  } else {
    store.setIsDebug();
  }
}
const playerID = ref<number | null>(playerIDDefault);
const isPlayerSelected = computed(() => {
  return playerID.value === 0 || playerID.value === 1;
});
const keyListener = (event: KeyboardEvent) => {
  // @ts-expect-error tagName DNE
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
  playerID.value === null ? playerID.value : String(playerID.value),
  matchID,
  store.zugToken,
);

watch(playerID, () => {
  matchClientOne.client.updatePlayerID(
    playerID.value === null ? playerID.value : String(playerID.value),
  );
});

onUnmounted(() => {
  matchClientOne.client.stop();
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

watch(gameStateLoaded, () => {
  if (!gameStateLoaded.value) {
    return;
  }
  if (!playerIDDefault) {
    // determine player # from user, set automatically
    const joinedPlayerID = matchClientOne.client.matchData?.findIndex(
      (player) => player.name && player.name === store.zugUsername,
    );
    if (joinedPlayerID !== undefined && joinedPlayerID >= 0) {
      playerID.value = joinedPlayerID;
    }
  }
});

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
  if (gameLastTurn.value && historyTurnStep.value < gameLastTurn.value.length)
    historyTurnStep.value++;
  else if (
    gameLastTurn.value &&
    historyTurnStep.value >= gameLastTurn.value.length &&
    historyTurn.value < gameState.G.history.length
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

const canJoin = computed(() => {
  const openPlayerSlot = matchClientOne.client.matchData?.some(
    (player) => player.name === undefined,
  );
  return playerID.value === null && !gameLastTurn.value && openPlayerSlot;
});
const handleJoin = () => {
  requestJoinMatch(matchID)
    .then((resp) => {
      if (resp) {
        playerID.value = Number(resp.playerID);
        location.reload();
      } else {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'There was a problem joining the match',
        });
      }
    })
    .catch((e) => {
      console.error(e);
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'There was a problem joining the match',
      });
    });
};

const serverURL = getServerURL();
const handlePoke = async () => {
  try {
    const resp = await axios.post(`${serverURL}/games/zug/${matchID}/poke`, {
      playerID: playerID.value === 0 ? 1 : 0,
    });
    if (resp.status === 200) {
      const { data } = resp;
      if (data.error) {
        toast.add({
          severity: 'error',
          summary: data.error,
          detail: 'Try again tomorrow?',
        });
      } else {
        toast.add({
          summary: 'Poked!',
        });
      }
    }
  } catch (e) {
    handleError(e, 'Could not find a way to poke your opponent.');
  }
};

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
  if (playerID.value === null) {
    return 'spectate';
  }
  if (gameState.ctx.activePlayers) {
    return gameState.ctx.activePlayers[playerID.value] || '?';
  } else {
    return 'end';
  }
});

const winner = computed(() => {
  if (gameState.ctx.gameover && matchData.value) {
    if (gameState.ctx.gameover.winner === -1) {
      return 'tie';
    }
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
  <main>
    <div v-if="canJoin">
      <p>To join, first sign in</p>
      <LoginComponent />
      <p>Then click join:</p>
      <Button label="Join" @click="handleJoin"></Button>
      <p>{{ joinStatus }}</p>
    </div>
    <div class="player-info">
      <span />
      <span
        :class="{
          checked: playerID === 0,
          status: true,
          online: matchData && matchData[0]?.isConnected,
        }"
      >
        {{ matchData ? matchData[0].name : 'player 1' }}</span
      >
      <span class="score">
        ({{ gameState.G.score ? gameState.G.score[0] : '?' }}) - ({{
          gameState.G.score ? gameState.G.score[1] : '?'
        }})
      </span>
      <span
        :class="{
          checked: playerID === 1,
          status: true,
          online: matchData && matchData[1]?.isConnected,
        }"
        >{{ matchData ? matchData[1].name : 'player 2' }}
      </span>
      <MatchInvite :matchID="matchID" />
    </div>
    <div class="game-phase-text">
      <p v-if="gamePhase === 'spectate'">You are spectating this game</p>
      <span v-else-if="gamePhase === 'resolution'" class="info-message">
        <span>Waiting for opponent to finish turn...</span>
        <button @click="handlePoke">poke?</button>
      </span>
      <p v-else-if="opponentWaiting" class="info-message">
        Your opponent is waiting for you to finish...
      </p>
      <p class="game-over" v-else-if="winner === 'tie'">It's a tie!</p>
      <p class="game-over" v-else-if="winner">{{ winner }} wins!</p>
    </div>
    <BoardComponent
      v-if="gameStateLoaded && playerID !== null"
      :client="matchClientOne.client"
      :state="gameState"
      :playerID="playerID"
      :showOrders="isPlayerSelected"
    />
    <div v-if="gameLastTurn">
      <p>HISTORY</p>
      <div class="history-stepper-row">
        <span class="p-buttonset nowrap">
          <ButtonStepper icon="pi pi-step-backward" @click="historyTurn = 1" />
          <ButtonStepper
            icon="pi pi-caret-left"
            @click="decrementHistoryTurn()"
            :disabled="historyTurn <= 1"
          />
        </span>
        <span class="history-order-number-display">{{ historyTurn }}</span>
        <span class="p-buttonset nowrap">
          <ButtonStepper
            icon="pi pi-caret-right"
            @click="incrementHistoryTurn()"
            :disabled="historyTurn >= gameState.G.history.length"
          />
          <ButtonStepper
            icon="pi pi-step-forward"
            @click="setHistoryLastTurn()"
          />
        </span>
      </div>
      <div>TURN {{ historyTurn }} STEP {{ historyTurnStep }}</div>
      <div class="history-stepper-row">
        <span class="p-buttonset nowrap">
          <ButtonStepper
            icon="pi pi-step-backward"
            @click="setHistoryStep(1)"
          />
          <ButtonStepper
            icon="pi pi-caret-left"
            @click="decrementHistoryStep()"
          />
        </span>
        <span class="history-order-number-display">{{ historyTurnStep }}</span>
        <span class="p-buttonset nowrap">
          <ButtonStepper
            icon="pi pi-caret-right"
            @click="incrementHistoryStep()"
          />
          <ButtonStepper
            icon="pi pi-step-forward"
            @click="setHistoryStep(gameLastTurn.length)"
          />
        </span>
      </div>
      <hr class="history-spacer" />
      <BoardDisplay
        :state="{ G: gameLastTurn[historyTurnStep - 1] }"
        :orderNumber="historyTurnStep"
      />
    </div>
    <div v-if="gameState.G.config" class="match-settings">
      <p>match settings</p>
      <!--prettier-ignore-->
      <pre>{{JSON.stringify(gameState.G.config, null, 2).trim()}}</pre>
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
  align-items: center;
  gap: 0.2rem;
}

.status::before {
  content: '\25CF';
  color: grey;
  right: 4px;
  position: relative;
}

.online::before {
  color: var(--color-theme-primary);
}

.score {
  white-space: nowrap;
}

.history-spacer {
  border: none;
  height: 3rem;
}

.info-message {
  color: coral;
}

.history-stepper-row {
  display: flex;
  justify-content: center;
  align-items: center;
}

.history-order-number-display {
  display: inline-block;
  width: 2rem;
  font-size: 1.2rem;
}

.checked {
  color: var(--color-theme-primary);
  font-weight: bold;
}

.game-phase-text {
  min-height: 1.6rem;
  padding: 0.2rem;
}

.game-over {
  font-size: 2rem;
  font-weight: bold;
  color: var(--color-theme-primary);
}

.match-settings {
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: left;
  align-items: center;
}
</style>
