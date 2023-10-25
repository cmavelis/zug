<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import type { Ref } from 'vue';
import type { _ClientImpl } from 'boardgame.io/dist/types/src/client/client';
import BoardDisplay from '@/components/BoardDisplayV2.vue';
import type { GameState } from '@/game/Game';
import type { Order, OrderTypes } from '@/game/orders';
import {
  arrayToCoordinates,
  coordinatesToArray,
  getDisplacement,
  getPiece,
} from '@/game/common';
import { createOrder } from '@/game/orders';
import { getValidSquaresForOrder } from '@/game/zugzwang/validators';

const NUMBER_PIECES = 4;

// TODO: display-only board, no client prop
interface BoardProps {
  client: _ClientImpl<GameState>;
  state: { G: GameState };
  playerID: number;
  showOrders: boolean;
}

const selectedPiece: Ref<undefined | number> = ref(undefined);
const selectedAction: Ref<undefined | OrderTypes> = ref(undefined);
const cellHover: Ref<undefined | number> = ref(undefined);

const props = defineProps<BoardProps>();
const flatOrders = computed(() => props.state.G.orders[props.playerID] || []);
const actionsUsed = computed(() => flatOrders.value.map((order) => order.type));
const piecesToPlace = computed(
  () =>
    getNumberPiecesMissing(props.state.G, props.playerID) -
    flatOrders.value.filter((order) => order.type === 'place').length,
);

const highlightedSquares: Ref<number[]> = computed(() => {
  if (selectedAction.value === 'place') {
    return getValidSquaresForOrder({
      playerID: props.playerID,
      board: props.state.G.board,
      orderType: 'place',
    }).map((coord) => coordinatesToArray(coord, props.state.G.board));
  }
  return [];
});

const addOrder = (order: Omit<Order, 'owner'>) => {
  props.client.moves.addOrder(order);
};

const handlePieceClick = (id: number) => {
  const piece = getPiece(props.state.G, id);
  if (!piece) return;

  // ignore selecting oppo piece
  if (piece.owner !== props.playerID) {
    return;
  }

  selectedPiece.value = id;
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

// select piece, then action, then cell
const handleCellClick = (cellID: number) => {
  const pieceID = props.state.G.cells[cellID];

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
    let pieceCoords = { x: 0, y: 0 };
    // negative value is nonexistent piece, use absolute coords
    if (selectedPiece.value >= 0) {
      pieceCoords = getPieceCoords(selectedPiece.value, props.state.G);
    }
    const targetCoords = arrayToCoordinates(
      cellHover.value,
      props.state.G.board,
    );

    const toTarget = getDisplacement(pieceCoords, targetCoords);
    const order = createOrder(
      {
        owner: props.playerID,
        sourcePieceId: selectedPiece.value,
        toTarget,
      },
      selectedAction.value,
    );
    // check order for validity

    // if invalid, early return && msg
    addOrder(order);
    clearAction();
  }
};

const handleCellHover = (cellId: number) => {
  cellHover.value = cellId;
};

const handleEndTurn = () => {
  const { endStage } = props.client.events;
  if (endStage) endStage();
};

const selectAction = (action: OrderTypes) => {
  selectedAction.value = action;
  if (action === 'place') {
    selectedPiece.value = -1;
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
  if (e.key === '3') {
    handleEndTurn();
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
        :board="props.state.G.board"
        :hovered-cell="cellHover"
        :handle-cell-hover="handleCellHover"
        :handle-cell-click="handleCellClick"
        :handle-piece-click="handlePieceClick"
        :highlighted-cells="highlightedSquares"
        :selected-piece-id="selectedPiece"
        :show-orders="props.showOrders"
      />
      <div class="order-button-group">
        <button
          :disabled="actionsUsed.includes('move-straight')"
          @click="selectAction('move-straight')"
        >
          move (straight)
        </button>
        <button
          :disabled="actionsUsed.includes('push-straight')"
          @click="selectAction('push-straight')"
        >
          push (straight)
        </button>
        <button
          :disabled="actionsUsed.includes('move-diagonal')"
          @click="selectAction('move-diagonal')"
        >
          move (diagonal)
        </button>
        <button
          :disabled="actionsUsed.includes('push-diagonal')"
          @click="selectAction('push-diagonal')"
        >
          push (diagonal)
        </button>
        <div>
          <button
            :disabled="piecesToPlace === 0"
            @click="selectAction('place')"
          >
            place new piece
          </button>
          ({{ piecesToPlace }})
        </div>
        <button @click="clearAction()">clear</button>
      </div>
    </div>
    <div v-if="props.showOrders">
      <p>
        piece:
        {{
          typeof selectedPiece === 'number'
            ? String(selectedPiece)
            : 'none selected'
        }}
      </p>
      <p>action: {{ selectedAction || 'none selected' }}</p>
      <p>ORDERS</p>
      <button @click="undoLastOrder()">undo last order</button>
      <button @click="handleEndTurn">end turn</button>
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
  <!--  <p>{{ props.state }}</p>-->
</template>

<style scoped>
button {
  -webkit-appearance: none;
  min-height: 2.5rem;
}

.layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.board-with-controls {
  --square-size: 50px;
  position: relative;
  display: flex;
  flex-direction: row;
  justify-content: center;
  gap: 8px;
}

.order-button-group {
  display: flex;
  flex-direction: column;
}

section {
  display: flex;
  flex-direction: row;
  justify-content: space-evenly;
  padding: 1rem;
}

svg {
  position: absolute;
  z-index: 2;
}
</style>
