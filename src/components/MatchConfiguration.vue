<script setup lang="ts">
import Button from 'primevue/button';
import InputSwitch from 'primevue/inputswitch';
import SelectButton from 'primevue/selectbutton';
import { ref } from 'vue';
import { PRIORITY_MODES } from '@/game/zugzwang/config';

const team = Array(8).fill('1');

const priorityRule = ref(PRIORITY_MODES.piece);
const priorityOptions = Object.values(PRIORITY_MODES);
</script>

<template>
  <div class="page-layout">
    <h2>Creating Match</h2>
    <span class="p-buttonset">
      <Button label="Standard" />
      <Button label="Create match" />
    </span>
    <h3>Configuration</h3>
    <div class="layout">
      <div class="config-item">
        <span>Best rule</span>
        <InputSwitch />
      </div>
      <div class="config-item">
        <span>Priority</span>
        <SelectButton
          v-model="priorityRule"
          :options="priorityOptions"
          :allow-empty="false"
        />
      </div>
      <div v-for="i in team" :key="i" class="config-item">
        <span>Other rule</span> <InputSwitch />
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

.mock {
  border: 1px solid red;
}
</style>
