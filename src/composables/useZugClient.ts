import { Client } from 'boardgame.io/client';
import { SimulChess, type ZugGameObject } from '@/game/Game';
import { Local } from 'boardgame.io/multiplayer';
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

// TODO: create a custom game definition
//    - use custom setup and endIf conditions
//   pass this game in the Client init
//   step 2: make a game that has no turn-end validation
//    - config.expectedNumberOrders = 1
//    - G.config.piecePriorityOptions.length
export const createLocalClient = (playerID?: string, game?: ZugGameObject) =>
  Client({
    game: game || SimulChess,
    multiplayer: Local(),
    playerID,
    debug: true,
  });

// mostly duplicate code for connecting to bgio game client
interface ReactiveGameState {
  G: GObject;
  ctx: Ctx;
}

export const useZugClient = (
  playerIDString: '0' | '1',
  game?: ZugGameObject,
) => {
  const playerIDDefault = Number(playerIDString);

  const playerID = ref<number | null>(playerIDDefault);
  const isPlayerSelected = computed(() => {
    return playerID.value === 0 || playerID.value === 1;
  });
  const tutorialClient = createLocalClient(playerIDString, game);
  tutorialClient.start();

  watch(playerID, () => {
    tutorialClient.updatePlayerID(
      playerID.value === null ? playerID.value : String(playerID.value),
    );
  });
  onUnmounted(() => {
    tutorialClient.stop();
  });
  const gameState: ReactiveGameState = shallowReactive({
    G: {} as GObject,
    ctx: {} as Ctx,
  });
  const gameStateLoaded = ref(false);
  const matchData: Ref<FilteredMetadata | undefined> = ref(undefined);
  const updateGameState = (state: ClientState<GObject>) => {
    matchData.value = tutorialClient.matchData;

    if (state) {
      gameStateLoaded.value = true;
      gameState.G = state.G as unknown as GObject;
      gameState.ctx = state.ctx;
    } else {
      console.warn('A null game state update was received');
    }
  };
  tutorialClient.subscribe(updateGameState);

  const isActiveTurn = true;
  return {
    client: tutorialClient,
    gameState,
    playerID: playerID,
    showOrders: isPlayerSelected,
    isActiveTurn: isActiveTurn,
  };
};
