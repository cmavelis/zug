<script setup lang="ts">
import Button from 'primevue/button';
import InputSwitch from 'primevue/inputswitch';
import InputMask from 'primevue/inputmask';
import SelectButton from 'primevue/selectbutton';
import Slider from 'primevue/slider';
import { computed, ref } from 'vue';
import {
  OUT_OF_BOUNDS_MODES,
  PRIORITY_MODES,
  PIECE_PRIORITY_DUPLICATES,
  PIECE_PRIORITIES_LIST,
  PUSH_ONLY_LOWER_NUMBERS,
  type ZugConfig,
} from '@/game/zugzwang/config';
import { getServerURL } from '@/utils';
import { LobbyClient } from 'boardgame.io/client';
import { useMatch } from '@/composables/useMatch';

const unlisted = ref(false);

const priorityRule = ref(PRIORITY_MODES.piece);
const priorityOptions = Object.values(PRIORITY_MODES);

const obRule = ref(OUT_OF_BOUNDS_MODES.turnEnd);
const obOptions = Object.values(OUT_OF_BOUNDS_MODES);

const maxPiecePriority = ref(PIECE_PRIORITIES_LIST.slice(-1)[0]);
const startPiecePriorities = ref();
const piecePriorityDuplicates = ref(PIECE_PRIORITY_DUPLICATES);
const pieceOnlyPushLowerNumbers = ref(PUSH_ONLY_LOWER_NUMBERS);

// input: "1,2,3,4"
const convertMaskedInputToArray = (masked: string) => {
  return masked.split(',').map(Number);
};

const ruleSet = computed<ZugConfig>(() => {
  return {
    priority: priorityRule.value,
    outOfBounds: obRule.value,
    piecePriorityOptions: [1, 2, 3, 4, 5, 6], // TODO make range
    startingPiecePriorities: startPiecePriorities.value
      ? convertMaskedInputToArray(startPiecePriorities.value)
      : [2, 3, 4, 5],
    piecePriorityDuplicates: piecePriorityDuplicates.value,
  };
});

const server = getServerURL();

const lobbyClient = new LobbyClient({ server });
const { navigateToMatch } = useMatch(lobbyClient);
const createMatch = async () => {
  try {
    const createdMatch = await lobbyClient.createMatch('zug', {
      numPlayers: 2,
      setupData: ruleSet.value,
      unlisted: unlisted.value,
    });
    if (createdMatch) {
      await navigateToMatch(createdMatch.matchID);
    }
  } catch (e) {
    console.error(e);
  }
};

// todo: 2-col layout
//  insert left/right elements
//  left: label with "info" hover => populate with description object
//  right: selector
</script>

<template>
  <div class="page-layout">
    <h2>Creating Match</h2>
    <span class="p-buttonset">
      <Button label="Create match" @click="createMatch" />
    </span>
    <h3>Configuration</h3>
    <div class="layout">
      <div class="config-item">
        <span>Private match</span>
        <InputSwitch v-model="unlisted" />
      </div>
      <div class="config-item">
        <span>Priority</span>
        <SelectButton
          v-model="priorityRule"
          :options="priorityOptions"
          :allow-empty="false"
        />
      </div>
      <div class="config-item">
        <span>Out of bounds</span>
        <SelectButton
          v-model="obRule"
          :options="obOptions"
          :allow-empty="false"
        />
      </div>
      <div class="config-item">
        <span>Piece priority range</span>
        <span>1-{{ maxPiecePriority }}</span>
        <Slider
          v-model="maxPiecePriority"
          :step="1"
          :min="1"
          :max="10"
          class="slider"
        />
      </div>
      <div class="config-item">
        <span>Piece priorities, start of game:</span>
        <InputMask
          v-model="startPiecePriorities"
          mask="9,9,9,9"
          placeholder="2,3,4,5"
        />
      </div>
      <p>(Coming soon)</p>
      <div class="config-item">
        <span>Piece priority: allow duplicates</span>
        <InputSwitch disabled v-model="piecePriorityDuplicates" />
      </div>
      <div class="config-item">
        <span>Piece priority: can only push lower numbers</span>
        <InputSwitch disabled v-model="pieceOnlyPushLowerNumbers" />
      </div>
    </div>
    <pre>{{ ruleSet }}</pre>
  </div>
</template>

<style scoped>
.page-layout {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.layout {
  display: flex;
  flex-direction: column;
  justify-content: center;
  max-width: 800px;
  gap: 8px;
}

.config-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
}

.slider {
  width: 14rem;
  margin: 0 8px;
}
</style>
