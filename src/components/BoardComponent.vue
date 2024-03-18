<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue';
import type { Ref } from 'vue';
import type { _ClientImpl } from 'boardgame.io/dist/types/src/client/client';
import Button from 'primevue/button';

import { BoardDisplay } from '@/components/BoardDisplay';
import type { GameState } from '@/game/Game';
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

const NUMBER_PIECES = 4;

interface BoardProps {
  client: _ClientImpl<GameState>;
  state: { G: GameState; ctx: any };
  playerID: number;
  showOrders: boolean;
}

const selectedPiece: Ref<undefined | number> = ref(undefined);
const selectedAction: Ref<undefined | OrderTypes> = ref(undefined);
const cellHover: Ref<undefined | number> = ref(undefined);
const endTurnMessage = ref('');
const pieceToPlace = ref(0);

const props = defineProps<BoardProps>();
const flatOrders = computed(() => props.state.G.orders[props.playerID] || []);
const actionsUsed = computed(() => flatOrders.value.map((order) => order.type));
const piecesToPlace = computed(
  () =>
    getNumberPiecesMissing(props.state.G, props.playerID) -
    flatOrders.value.filter((order) => order.type === 'place').length,
);
const gamePhase = computed(() => {
  if (props.state.ctx.activePlayers) {
    return props.state.ctx.activePlayers[props.playerID] || '?';
  } else {
    return 'end';
  }
});
const canEndTurn = computed(
  () => actionsUsed.value.length === 4 && gamePhase.value === 'planning',
);
const piecesWithoutActions = computed(() => {
  const idSet = new Set(
    props.state.G.pieces
      .filter((p) => p.owner === props.playerID)
      .map((p) => p.id),
  );
  flatOrders.value.forEach((o) => idSet.delete(o.sourcePieceId));
  return Array.from(idSet);
});

const validSquares: Ref<number[]> = computed(() => {
  if (selectedAction.value === 'place') {
    return getValidSquaresForOrder({
      playerID: props.playerID,
      board: props.state.G.config.board,
      orderType: 'place',
    }).map((coord) => coordinatesToArray(coord, props.state.G.config.board));
  }
  if (
    selectionPhase.value === SELECTION_PHASES.targeting &&
    selectedAction.value &&
    selectedPiece.value !== undefined
  ) {
    const piece = getPiece(props.state.G, selectedPiece.value);
    if (piece)
      return getValidSquaresForOrder({
        playerID: props.playerID,
        board: props.state.G.config.board,
        orderType: selectedAction.value,
        origin: piece.position,
      }).map((coord) => coordinatesToArray(coord, props.state.G.config.board));
  }
  return [];
});

// hint at pieces that can't be pushed
const targetingHints: Ref<any[]> = computed(() => {
  const { piecePushRestrictions } = props.state.G.config;
  if (piecePushRestrictions === null) {
    return [];
  }

  if (
    selectionPhase.value === SELECTION_PHASES.targeting &&
    selectedAction.value?.startsWith('push') &&
    selectedPiece.value !== undefined
  ) {
    const piece = getPiece(props.state.G, selectedPiece.value);
    if (piece)
      return props.state.G.pieces.map((p) => {
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

  const piece = getPiece(props.state.G, id);
  if (!piece) return;

  // pieces now capture the click, not the cell
  console.debug('piece click', id);

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
  const piece = getPiece(props.state.G, id);
  if (!piece) return;

  handleCellHover(
    coordinatesToArray(piece.position, props.state.G.config.board),
  );
};

const getPieceCoords = (pieceID: number, G: GameState) => {
  const piece = G.pieces.find((p) => p.id === pieceID);
  if (!piece) {
    throw Error(`Could not find piece with ID: ${pieceID}`);
  }
  return piece.position;
};

const getNumberPiecesMissing = (G: GameState, playerID: number) => {
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
    pieceCoords = getPieceCoords(selectedPiece.value, props.state.G);
  }
  const targetCoords = arrayToCoordinates(
    cellHover.value,
    props.state.G.config.board,
  );

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
    if (!canAddPlaceOrder(order, props.state.G)) {
      return;
    }
  }

  if (!isValidOrder(props.playerID as 0 | 1, order)) {
    return;
  }

  addOrder(order);
  clearAction();
};

// select piece, then action, then cell
const handleCellClick = (cellID: number) => {
  console.debug('cell click', cellID);
  const pieceID = props.state.G.cells[cellID];
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
  const { endStage } = props.client.events;
  if (flatOrders.value.length < 4 && !store.isDebug) {
    endTurnMessage.value =
      'Cannot end turn yet. You must use all available actions. (zug)';
    return;
  }
  if (endStage) endStage();
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
    <div class="board-with-controls">
      <BoardDisplay
        :pieces="props.state.G.pieces"
        :orders="flatOrders"
        :board="props.state.G.config.board"
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
      />
      <div class="order-button-group">
        <input
          v-if="store.isDebug"
          v-model.number="pieceToPlace"
          type="number"
        />
        <div
          v-if="
            props.state.G.config.placePriorityAssignment?.beforeTurn &&
            props.state.G.piecesToPlace
          "
        >
          <label>place</label>
          <Button
            v-for="piecePriority in props.state.G.piecesToPlace[playerID]"
            :key="piecePriority"
            :label="String(piecePriority)"
            :disabled="
              flatOrders.some((o) => {
                if ('newPiecePriority' in o) {
                  return o.newPiecePriority === piecePriority;
                }
              })
            "
            size="small"
            severity="secondary"
            @click="
              () => {
                selectAction('place');
                pieceToPlace = piecePriority;
              }
            "
          />
        </div>
        <Button
          v-else
          label="place new piece"
          size="small"
          severity="secondary"
          :disabled="piecesToPlace === 0"
          :badge="String(piecesToPlace)"
          @click="selectAction('place')"
        />
      </div>
    </div>
    <div class="actions-text" v-if="props.showOrders">
      <Button
        size="small"
        severity="secondary"
        @click="undoLastOrder()"
        label="undo last action"
      />
      <Button
        size="small"
        :severity="canEndTurn ? 'primary' : 'secondary'"
        @click="handleEndTurn"
        :class="{ 'halo-shadow': canEndTurn }"
        label="end turn"
      />
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
        v-for="order in props.state.G.orders[props.playerID]"
        :key="order.sourcePieceId"
      >
        <p>
          piece {{ order.sourcePieceId }}: {{ order.type }} with vector
          {{ order.toTarget }}
        </p>
      </template>
    </div>
  </section>
</template>

<style scoped>
.layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.2rem;
}

.board-with-controls {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  justify-self: end;
  gap: 8px;
}

@media (max-width: 500px) {
  .layout {
    grid-template-columns: 1fr;
  }
  .board-with-controls {
    justify-self: center;
  }
}

.info-message {
  color: coral;
  font-weight: bold;
}

.order-button-group {
  display: flex;
  gap: 4px;
  flex-direction: column;
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
