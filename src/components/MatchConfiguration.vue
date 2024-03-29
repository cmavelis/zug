<script setup lang="ts">
import Button from 'primevue/button';
import InputNumber from 'primevue/inputnumber';
import InputSwitch from 'primevue/inputswitch';
import InputMask from 'primevue/inputmask';
import SelectButton from 'primevue/selectbutton';
import Slider from 'primevue/slider';
import { useField } from 'vee-validate';
import { computed, ref } from 'vue';
import { LobbyClient } from 'boardgame.io/client';

import {
  OUT_OF_BOUNDS_MODES,
  PRIORITY_MODES,
  PIECE_PRIORITY_DUPLICATES,
  PIECE_PRIORITIES_LIST,
  PUSH_ONLY_LOWER_NUMBERS,
  type ZugConfig,
} from '@/game/zugzwang/config';
import { getServerURL } from '@/utils';
import { useMatch } from '@/composables/useMatch';
import type { GameSetupData } from '@/game/Game';

// input: "1,2,3,4"
const convertMaskedInputToArray = (masked: string) => {
  return masked.split(',').map(Number);
};
const validateStartingPriorities = (value: string | undefined) => {
  if (value === undefined || value === '') {
    return true;
  }
  const arrayValue = convertMaskedInputToArray(value);
  if (arrayValue.some((v) => !v)) {
    return 'Must be 4 non-zero integers';
  }
  return true;
};

const { value: startPiecePriorities } = useField(
  'startPiecePriorities',
  validateStartingPriorities,
);

const unlisted = ref(false);

const priorityRule = ref(PRIORITY_MODES.piece);
const priorityOptions = Object.values(PRIORITY_MODES);

const obRule = ref(OUT_OF_BOUNDS_MODES.turnEnd);
const obOptions = Object.values(OUT_OF_BOUNDS_MODES);

const maxPiecePriority = ref(PIECE_PRIORITIES_LIST.slice(-1)[0]);
const piecePriorityDuplicates = ref(PIECE_PRIORITY_DUPLICATES);
const pieceOnlyPushLowerNumbers = ref(PUSH_ONLY_LOWER_NUMBERS);
const pushRestrictionMultiply = ref(1);
const pushRestrictionAdd = ref(0);

const ruleSet = computed<ZugConfig>(() => {
  return {
    priority: priorityRule.value,
    outOfBounds: obRule.value,
    piecePriorityOptions: Array(maxPiecePriority.value)
      .fill(1)
      .map((v, i) => i + 1),
    startingPiecePriorities: startPiecePriorities.value
      ? convertMaskedInputToArray(startPiecePriorities.value)
      : [2, 3, 4, 5],
    piecePriorityDuplicates: piecePriorityDuplicates.value,
    piecePushRestrictions:
      pieceOnlyPushLowerNumbers.value === true
        ? {
            add: pushRestrictionAdd.value,
            multiply: pushRestrictionMultiply.value,
          }
        : null,
  };
});

const server = getServerURL();

const lobbyClient = new LobbyClient({ server });
const { navigateToMatch } = useMatch(lobbyClient);
const createMatch = async () => {
  try {
    const setupData: GameSetupData = { config: ruleSet.value };
    const createdMatch = await lobbyClient.createMatch('zug', {
      numPlayers: 2,
      setupData,
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
        <div>
          <InputMask
            v-model="startPiecePriorities"
            mask="9,9,9,9"
            placeholder="2,3,4,5"
          />
          <p>
            Must be 4 non-zero integers.<br />
            Defaults to 2,3,4,5 if left empty
          </p>
        </div>
      </div>
      <div class="config-item">
        <span>Piece priority: allow duplicates</span>
        <InputSwitch v-model="piecePriorityDuplicates" />
      </div>
      <h4>(Experimental)</h4>
      <div class="config-item">
        <span>Piece priority push restrictions:</span>
        <InputSwitch v-model="pieceOnlyPushLowerNumbers" />
        <div class="push-restrict">
          <p>
            Fill in the equation to determine when piece with priority A can
            push piece with priority B
          </p>
          <p>
            (<InputNumber
              input-class="push-restriction-input"
              v-model="pushRestrictionMultiply"
              :min="1"
              :max="10"
            />
            * A) +
            <InputNumber
              input-class="push-restriction-input"
              v-model="pushRestrictionAdd"
              inputId="minmax"
              :min="0"
              :max="10"
            />
            > B
          </p>
        </div>
      </div>
    </div>
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
  column-gap: 12px;
}

.slider {
  width: 14rem;
  margin: 0 8px;
}
.push-restrict {
  width: 18rem;
}
</style>
<!--push-restriction-input is used in InputNumber, scoping not working right-->
<style>
.push-restriction-input {
  width: 2.5rem;
  height: 2.5rem;
  padding: 0.5rem;
}
</style>
