<script setup lang="ts">
import Button from 'primevue/button';
const team = Array(8).fill('1');
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
      <div v-for="i in team" :key="i" class="mock">i</div>
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
  flex-direction: row;
  justify-content: center;
  max-width: 800px;
}

.mock {
  border: 1px solid red;
}
</style>
