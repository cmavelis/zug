<script setup lang="ts">
import BoardComponent from '@/components/BoardComponent.vue';
import { SimulChessClient } from '@/game/App';
import {
  computed,
  onUnmounted,
  type Ref,
  ref,
  shallowReactive,
  watch,
} from 'vue';
import type { GObject } from '@/game/Game';
import type { Ctx, FilteredMetadata } from 'boardgame.io';
import type { ClientState } from 'boardgame.io/dist/types/src/client/client';

// mostly duplicate code for connecting to bgio game client
interface ReactiveGameState {
  G: GObject;
  ctx: Ctx;
}

const playerIDDefault = 0;

const playerID = ref<number | null>(playerIDDefault);
const isPlayerSelected = computed(() => {
  return playerID.value === 0 || playerID.value === 1;
});

const matchClient = new SimulChessClient('0', undefined, undefined, true);

watch(playerID, () => {
  matchClient.client.updatePlayerID(
    playerID.value === null ? playerID.value : String(playerID.value),
  );
});
onUnmounted(() => {
  matchClient.client.stop();
});
const gameState: ReactiveGameState = shallowReactive({
  G: {} as GObject,
  ctx: {} as Ctx,
});
const gameStateLoaded = ref(false);
const matchData: Ref<FilteredMetadata | undefined> = ref(undefined);
const updateGameState = (state: ClientState<{ G: GObject; ctx: Ctx }>) => {
  matchData.value = matchClient.client.matchData;

  if (state) {
    gameStateLoaded.value = true;
    gameState.G = state.G as unknown as GObject;
    gameState.ctx = state.ctx;
  } else {
    console.warn('A null game state update was received');
  }
};
matchClient.client.subscribe(updateGameState);

const isActiveTurn = true;
</script>

<template>
  <BoardComponent
    :client="matchClient.client"
    :state="gameState.G"
    :ctx="gameState.ctx"
    :config="gameState.G.config"
    :playerID="playerID"
    :showOrders="isPlayerSelected"
    :isActiveTurn="isActiveTurn"
  />
</template>

<style scoped></style>
