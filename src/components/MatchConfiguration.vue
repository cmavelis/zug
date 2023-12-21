<script setup lang="ts">
import Button from 'primevue/button';
import InputSwitch from 'primevue/inputswitch';
import SelectButton from 'primevue/selectbutton';
import Slider from 'primevue/slider';
import { ref } from 'vue';
import {
  OUT_OF_BOUNDS_MODES,
  PRIORITY_MODES,
  PIECE_PRIORITY_DUPLICATES,
  PIECE_PRIORITIES_LIST,
  PUSH_ONLY_LOWER_NUMBERS,
} from '@/game/zugzwang/config';

const priorityRule = ref(PRIORITY_MODES.piece);
const priorityOptions = Object.values(PRIORITY_MODES);

const obRule = ref(OUT_OF_BOUNDS_MODES.turnEnd);
const obOptions = Object.values(OUT_OF_BOUNDS_MODES);

const maxPiecePriority = ref(PIECE_PRIORITIES_LIST.slice(-1)[0]);
const piecePriorityOverlap = ref(PIECE_PRIORITY_DUPLICATES);
const pieceOnlyPushLowerNumbers = ref(PUSH_ONLY_LOWER_NUMBERS);

// todo: 2-col layout
//  insert left/right elements
//  left: label with "info" hover => populate with description object
//  right: selector
</script>

<template>
  <div class="page-layout">
    <h2>Creating Match</h2>
    <span class="p-buttonset">
      <Button label="Default" severity="secondary" />
      <Button label="Create match" />
    </span>
    <h3>Configuration</h3>
    <div class="layout">
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
      <p>(The following aren't implemented yet)</p>
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
        <span>Piece priority: allow duplicates</span>
        <InputSwitch v-model="piecePriorityOverlap" />
      </div>
      <div class="config-item">
        <span>Piece priority: can only push lower numbers</span>
        <InputSwitch v-model="pieceOnlyPushLowerNumbers" />
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
  gap: 4px;
}

.config-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 4px;
}

.slider {
  width: 14rem;
  margin: 0 8px;
}

.mock {
  border: 1px solid red;
}
</style>
