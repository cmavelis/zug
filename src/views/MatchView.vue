<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';

import type { ClientState } from 'boardgame.io/dist/types/src/client/client';
import type { Ctx } from 'boardgame.io/dist/types/src/types';
import { isEqual } from 'lodash';

import BoardComponent from '@/components/BoardComponent.vue';
import BoardDisplay from '@/components/BoardDisplay.vue';
import { SimulChessClient } from '@/game/App';
import type { GameState, GObject } from '@/game/Game';

interface ReactiveGameState {
  G: GameState | {};
  ctx: Ctx | {};
}

const route = useRoute();
let playerIDDefault = 0;
const showPlayerSelect = ref(true);

if (route.query.player) {
  playerIDDefault = Number(route.query.player) - 1;
  showPlayerSelect.value = false;
}
const playerID = ref(playerIDDefault);

let matchID: string;

if (typeof route.params.matchID === 'string') {
  matchID = route.params.matchID;
} else {
  matchID = route.params.matchID[0];
}
const matchClientOne = new SimulChessClient('0', matchID);
const matchClientTwo = new SimulChessClient('1', matchID);

const gameState: ReactiveGameState = reactive({ G: {}, ctx: {} });
const gameStateLoaded = ref(false);
const updateGameState = (state: ClientState<{ G: GameState; ctx: Ctx }>) => {
  if (state) {
    gameStateLoaded.value = true;
    gameState.G = state.G;
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

const gameStateTwo = reactive({ G: {}, ctx: {} });
const gameStateTwoLoaded = ref(false);

const updateGameStateTwo = (state: ClientState<{ G: GameState; ctx: Ctx }>) => {
  if (state) {
    gameStateTwo.G = state.G;
    gameStateTwo.ctx = state.ctx;
    gameStateTwoLoaded.value = true;
  } else {
    console.error('A null game state update was received');
  }
};
matchClientTwo.client.subscribe(updateGameStateTwo);
</script>

<template>
  <main>
    <input type="radio" v-if="showPlayerSelect" v-model="playerID" :value="0" />
    <span :class="{ checked: !playerID }"> player 1</span> ({{
      gameState.G.score[0]
    }}) - ({{ gameState.G.score[1] }})
    <span :class="{ checked: playerID }">player 2</span>
    <input type="radio" v-if="showPlayerSelect" v-model="playerID" :value="1" />
    <p>
      phase:
      {{
        gameState.ctx.activePlayers
          ? gameState.ctx.activePlayers[playerID]
          : 'end!'
      }}
    </p>

    <BoardComponent
      v-if="playerID === 0 && gameStateLoaded"
      :client="matchClientOne.client"
      :state="gameState"
      :playerID="playerID"
    />
    <BoardComponent
      v-if="playerID === 1 && gameStateTwoLoaded"
      :client="matchClientTwo.client"
      :state="gameStateTwo"
      :playerID="playerID"
    />
    <div v-if="gameLastTurn">
      <div>LAST TURN</div>
      <BoardDisplay
        :state="{ G: gameLastTurn[historyOrderNumber - 1] }"
        :orderNumber="historyOrderNumber"
      />

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
    </div>
  </main>
</template>

<style>
main {
  padding: 1rem 0;
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
