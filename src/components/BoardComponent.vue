<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue';
import type { Ref } from 'vue';
import type { _ClientImpl } from 'boardgame.io/dist/types/src/client/client';
import type { Ctx } from 'boardgame.io';
import Button from 'primevue/button';

import { BoardDisplayV2 as BoardDisplay } from '@/components/BoardDisplay';
import PlaceButton from '@/components/BoardComponentPlaceButton.vue';
import type { GameState, GameStateHistory, ZugConfig } from '@/game/Game';
import type { Order, OrderTypes } from '@/game/orders';
import {
  arrayToCoordinates,
  coordinatesToArray,
  getDisplacement,
  getPiece,
} from '@/game/common';
import { canPushWithConfig, createOrder } from '@/game/orders';
import {
  canAddPlaceOrder,
  getValidSquaresForOrder,
  isValidOrder,
  isValidPlaceOrder,
} from '@/game/zugzwang/validators';
import { store } from '@/store';
import type { MenuItem } from 'primevue/menuitem';
import { validateTurnEnd } from '@/game/zugzwang/validators';

const NUMBER_PIECES = 4;

interface BoardProps {
  client: _ClientImpl<GameState>;
  state: GameStateHistory;
  ctx: Ctx;
  config: ZugConfig;
  playerID: number | null; // null for spectator
  showOrders: boolean;
  isActiveTurn: boolean;
}

const selectedPiece: Ref<undefined | number> = ref(undefined);
const selectedAction: Ref<undefined | OrderTypes> = ref(undefined);
const cellHover: Ref<undefined | number> = ref(undefined);
const endTurnMessage = ref('');
const pieceToPlace = ref(0);

const props = defineProps<BoardProps>();
const flatOrders = computed(() =>
  props.playerID !== null ? props.state.orders[props.playerID] : [],
);
const allOrders = computed(() => {
  let orders: Order[] = [];
  for (let i of [0, 1]) {
    if (props.state.orders[i]) {
      orders = orders.concat(props.state.orders[i]);
    }
  }

  return orders;
});

const actionsUsed = computed(() => flatOrders.value.map((order) => order.type));
// # of pieces to place
const piecesToPlace = computed(
  () =>
    getNumberPiecesMissing(props.state, props.playerID) -
    flatOrders.value.filter((order) => order.type === 'place').length,
);
const gamePhase = computed(() => {
  if (props.ctx.activePlayers) {
    return props.ctx.activePlayers[props.playerID] || '?';
  } else {
    return 'end';
  }
});
const canEndTurn = computed(() => {
  if (gamePhase.value !== 'planning') {
    return false;
  }

  if (props.playerID === null) {
    return false;
  }

  const validation = validateTurnEnd(
    props.playerID,
    props.state.orders,
    props.state.pieces,
  );
  return validation.canEndTurn;
});
const piecesWithoutActions = computed(() => {
  const idSet = new Set(
    props.state.pieces
      .filter((p) => p.owner === props.playerID)
      .map((p) => p.id),
  );
  flatOrders.value.forEach((o) => idSet.delete(o.sourcePieceId));
  return Array.from(idSet);
});
const piecesToPlaceSorted = computed(() => {
  const piecesToPlace = props.state.piecesToPlace || { 0: [], 1: [] };
  return {
    0: [...piecesToPlace[0]].sort(),
    1: [...piecesToPlace[1]].sort(),
  };
});

const validSquares: Ref<number[]> = computed(() => {
  if (selectedAction.value === 'place') {
    return getValidSquaresForOrder({
      playerID: props.playerID,
      board: props.config.board,
      orderType: 'place',
    }).map((coord) => coordinatesToArray(coord, props.config.board));
  }
  if (
    selectionPhase.value === SELECTION_PHASES.targeting &&
    selectedAction.value &&
    selectedPiece.value !== undefined
  ) {
    const piece = getPiece(props.state, selectedPiece.value);
    if (piece)
      return getValidSquaresForOrder({
        playerID: props.playerID,
        board: props.config.board,
        orderType: selectedAction.value,
        origin: piece.position,
      }).map((coord) => coordinatesToArray(coord, props.config.board));
  }
  return [];
});

// hint at pieces that can't be pushed
const targetingHints: Ref<any[]> = computed(() => {
  const { piecePushRestrictions } = props.config;
  if (piecePushRestrictions === null) {
    return [];
  }

  if (
    selectionPhase.value === SELECTION_PHASES.targeting &&
    selectedAction.value?.startsWith('push') &&
    selectedPiece.value !== undefined
  ) {
    const piece = getPiece(props.state, selectedPiece.value);
    if (piece)
      return props.state.pieces.map((p) => {
        return {
          pieceID: p.id,
          notPushable: !canPushWithConfig(piecePushRestrictions, piece, p),
        };
      });
  }
  return [];
});

const SELECTION_PHASES = {
  ready: 'ready',
  menu: 'menu',
  targeting: 'targeting',
};
// todo: can use this to simplify logic in click handlers
const selectionPhase = computed(() => {
  if (selectedPiece.value !== undefined) {
    if (selectedAction.value !== undefined) {
      return SELECTION_PHASES.targeting;
    } else {
      return SELECTION_PHASES.menu;
    }
  }
  return SELECTION_PHASES.ready;
});

const addOrder = (order: Omit<Order, 'owner'>) => {
  props.client.moves.addOrder(order);
};

const handlePieceClick = (id: number, e?: Event) => {
  if (e?.target instanceof Element && e?.target?.closest('.p-speeddial')) {
    // handle primevue speeddial and its children actions on their own
    return;
  }

  const piece = getPiece(props.state, id);
  if (!piece) return;

  // already piece selected
  if (typeof selectedPiece.value === 'number') {
    if (id === selectedPiece.value) {
      clearAction();
      return;
    }
    if (selectedAction.value) {
      targetClick();
      return;
    }
  } else {
    // ignore selecting oppo piece
    if (piece.owner !== props.playerID) {
      return;
    }
  }
  selectedPiece.value = id;
};

const handlePieceHover = (id: number) => {
  const piece = getPiece(props.state, id);
  if (!piece) return;

  handleCellHover(coordinatesToArray(piece.position, props.config.board));
};

const getPieceCoords = (pieceID: number, G: GameStateHistory) => {
  const piece = G.pieces.find((p) => p.id === pieceID);
  if (!piece) {
    throw Error(`Could not find piece with ID: ${pieceID}`);
  }
  return piece.position;
};

const getNumberPiecesMissing = (G: GameStateHistory, playerID: number) => {
  return NUMBER_PIECES - G.pieces.filter((p) => p.owner === playerID).length;
};

const targetClick = () => {
  if (
    !(
      typeof selectedPiece.value === 'number' &&
      selectedAction.value &&
      typeof cellHover.value === 'number'
    )
  ) {
    return;
  }
  let pieceCoords = { x: 0, y: 0 };
  // negative value is nonexistent piece, use absolute coords
  if (selectedPiece.value >= 0) {
    pieceCoords = getPieceCoords(selectedPiece.value, props.state);
  }
  const targetCoords = arrayToCoordinates(cellHover.value, props.config.board);

  const toTarget = getDisplacement(pieceCoords, targetCoords);
  const order = createOrder(
    {
      owner: props.playerID as 0 | 1,
      sourcePieceId: selectedPiece.value,
      toTarget,
    },
    selectedAction.value,
  );
  // check order for validity
  if (order.type === 'place') {
    if (!isValidPlaceOrder(order) && !store.isDebug) {
      return;
    }
    // piece priority placement
    if (pieceToPlace.value > 0) {
      order.newPiecePriority = pieceToPlace.value;
    }
    if (!canAddPlaceOrder(order, { ...props.state, config: props.config })) {
      return;
    }
  }

  if (!isValidOrder(props.playerID as 0 | 1, order)) {
    return;
  }

  addOrder(order);
  clearAction();
};

const handlePlaceButtonClick = (piecePriority: number) => {
  if (selectedAction.value !== 'place') {
    selectAction('place');
    pieceToPlace.value = piecePriority;
  } else if (pieceToPlace.value === piecePriority) {
    clearAction();
    pieceToPlace.value = 0;
  } else {
    pieceToPlace.value = piecePriority;
  }
};

// select piece, then action, then cell
const handleCellClick = (cellID: number) => {
  console.debug('cell click', cellID);
  const pieceID = props.state.cells[cellID];
  endTurnMessage.value = '';

  if (
    typeof pieceID === 'number' &&
    (selectedAction.value === undefined || selectedPiece.value === undefined)
  ) {
    handlePieceClick(pieceID);
    return;
  }
  if (
    typeof selectedPiece.value === 'number' &&
    selectedAction.value &&
    typeof cellHover.value === 'number'
  ) {
    targetClick();
  } else {
    selectedPiece.value = undefined;
  }
};

const handleCellHover = (cellId: number) => {
  cellHover.value = cellId;
};

const handleEndTurn = () => {
  if (props.playerID === null) {
    return;
  }
  const validation = validateTurnEnd(
    props.playerID,
    props.state.orders,
    props.state.pieces,
  );

  if (!validation.canEndTurn) {
    endTurnMessage.value = 'All your pieces must take action';
    return;
  }
  endTurnMessage.value = '';

  props.client.moves.endTurn();
};

const handleCancelAction = (pieceID: number) => {
  props.client.moves.removeOrder(pieceID);
  clearAction();
};

const createCancelMenuItem = (pieceID: number) => {
  return {
    label: 'Cancel action',
    icon: 'pi pi-times',
    command: () => handleCancelAction(pieceID),
  };
};

const actionMenuPerPiece = ref();

watch(actionsUsed, () =>
  setTimeout(() => {
    const actionMenuItems: MenuItem[] = [
      {
        label: 'Move straight',
        icon: 'pi pi-arrow-up',
        command: () => selectAction('move-straight'),
        disabled: actionsUsed.value.includes('move-straight'),
      },
      {
        label: 'Push straight',
        icon: 'zi zi-arrow-up-flat',
        command: () => selectAction('push-straight'),
        disabled: actionsUsed.value.includes('push-straight'),
      },
      {
        label: 'Move diagonal',
        icon: 'pi pi-arrow-up-right',
        command: () => selectAction('move-diagonal'),
        disabled: actionsUsed.value.includes('move-diagonal'),
      },

      {
        label: 'Push diagonal',
        icon: 'zi zi-arrow-up-right-flat',
        command: () => selectAction('push-diagonal'),
        disabled: actionsUsed.value.includes('push-diagonal'),
      },
      // { label: 'Place', icon: 'pi pi-download', disabled: true },
    ].reverse();

    const actionMenuFiltered = { ...Array(8).fill(actionMenuItems) };

    // add "cancel" items for pieces that have an action already
    for (let i in Array(8).fill(1)) {
      if (flatOrders.value.find((order) => order.sourcePieceId === +i)) {
        actionMenuFiltered[i] = [createCancelMenuItem(+i)];
      }
    }

    actionMenuPerPiece.value = actionMenuFiltered;
  }, 200),
);

const selectAction = (action: OrderTypes) => {
  selectedAction.value = action;
  if (action === 'place') {
    selectedPiece.value = -1;
  } else if (selectedPiece.value === -1) {
    selectedPiece.value = undefined;
  }
};

const clearAction = () => {
  selectedAction.value = undefined;
  selectedPiece.value = undefined;
};

const undoLastOrder = () => {
  props.client.moves.removeLastOrder();
};

const keyListener = (e: KeyboardEvent) => {
  // @ts-expect-error tagname DNE
  if (e?.target?.tagName?.toLowerCase() === 'input') {
    return;
  }
  if (e.key === '3') {
    handleEndTurn();
  }
  if (e.key === 'p') {
    selectAction('place');
  }
};

onMounted(() => {
  window.addEventListener('keydown', keyListener);
});

onUnmounted(() => {
  window.removeEventListener('keydown', keyListener);
});
</script>

<template>
  <section class="layout">
    <div>
      <Button
        size="small"
        severity="secondary"
        @click="undoLastOrder()"
        label="undo last action"
        :disabled="!props.isActiveTurn"
      />
      <Button
        size="small"
        :severity="canEndTurn && props.isActiveTurn ? 'primary' : 'secondary'"
        @click="handleEndTurn"
        :class="{ 'halo-shadow': canEndTurn && props.isActiveTurn }"
        :disabled="!props.isActiveTurn"
        label="end turn"
      />
    </div>
    <div class="board-with-controls">
      <div class="order-button-group">
        <input
          v-if="store.isDebug"
          v-model.number="pieceToPlace"
          type="number"
        />
        <template v-if="props.config.placePriorityAssignment">
          <div class="place-button-group">
            <PlaceButton
              v-for="piecePriority in piecesToPlaceSorted[0]"
              :key="piecePriority"
              :piece-priority="piecePriority"
              :disabled="
                props.playerID !== 0 ||
                piecesToPlace === 0 ||
                flatOrders.some((o) => {
                  if ('newPiecePriority' in o) {
                    return o.newPiecePriority === piecePriority;
                  }
                })
              "
              :selected="
                selectedAction === 'place' &&
                pieceToPlace === piecePriority &&
                props.playerID === 0
              "
              class="player-one-piece"
              @click="handlePlaceButtonClick(piecePriority)"
            />
          </div>
          <label>place</label>
          <div class="place-button-group">
            <PlaceButton
              v-for="piecePriority in piecesToPlaceSorted[1]"
              :key="piecePriority"
              :piece-priority="piecePriority"
              :disabled="
                props.playerID !== 1 ||
                piecesToPlace === 0 ||
                flatOrders.some((o) => {
                  if ('newPiecePriority' in o) {
                    return o.newPiecePriority === piecePriority;
                  }
                })
              "
              :selected="
                selectedAction === 'place' &&
                pieceToPlace === piecePriority &&
                props.playerID === 1
              "
              class="player-two-piece"
              @click="handlePlaceButtonClick(piecePriority)"
            />
          </div>
        </template>
        <Button
          v-else
          label="place new piece"
          size="small"
          severity="secondary"
          :disabled="piecesToPlace === 0"
          :badge="String(piecesToPlace)"
          @click="selectAction('place')"
          class="place-button-default"
          :pt="{ badge: 'place-button-default-badge' }"
        />
      </div>
      <BoardDisplay
        :pieces="props.state.pieces"
        :orders="allOrders"
        :events="props.state.events"
        :board="props.config.board"
        :hovered-cell="cellHover"
        :handle-cell-hover="handleCellHover"
        :handle-cell-click="handleCellClick"
        :handle-piece-click="handlePieceClick"
        :handlePieceHover="handlePieceHover"
        :highlighted-cells="validSquares"
        :selected-piece-id="selectedPiece"
        :show-orders="props.showOrders"
        :emphasized-piece-ids="piecesWithoutActions"
        :action-menu-items="actionMenuPerPiece"
        :targetingHints="targetingHints"
        :disableCommandMenu="!props.isActiveTurn"
      />
    </div>
    <div v-if="props.showOrders && props.isActiveTurn">
      <div v-if="store.isDebug">
        <p>
          piece:
          {{
            typeof selectedPiece === 'number'
              ? String(selectedPiece)
              : 'none selected'
          }}
        </p>
        <p>action: {{ selectedAction || 'none selected' }}</p>

        <p>ACTIONS</p>
        <p v-if="endTurnMessage" class="info-message">{{ endTurnMessage }}</p>
        <template
          v-for="order in props.state.orders[props.playerID]"
          :key="order.sourcePieceId"
        >
          <p>
            piece {{ order.sourcePieceId }}: {{ order.type }} with vector
            {{ order.toTarget }}
          </p>
        </template>
      </div>
    </div>
  </section>
  <p v-if="endTurnMessage" class="info-message">{{ endTurnMessage }}</p>
</template>

<style scoped>
.layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.2rem;
}

.board-with-controls {
  position: relative;
  display: grid;
  grid-template-columns: 1fr min-content 1fr;
  justify-content: center;
  justify-self: center;
  gap: 8px;
  margin: 18px 0;
}

@media (max-width: 500px) {
}

.info-message {
  color: coral;
  font-weight: bold;
}

.order-button-group {
  display: flex;
  gap: 4px;
  flex-direction: column;
  justify-content: center;
}

.place-button-group {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.place-button-default {
  display: flex;
  flex-direction: column;
  width: min-content;
  padding: 8px;
  gap: 4px;
}

:deep(.p-button .p-badge) {
  margin: 0;
}

section {
  display: flex;
  flex-direction: row;
  justify-content: space-evenly;
  padding: 1rem;
}

@media (max-width: 500px) {
  section {
    padding: 0;
  }
}

svg {
  position: absolute;
  z-index: 2;
}
</style>
