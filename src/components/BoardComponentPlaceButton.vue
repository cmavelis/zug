<script setup lang="ts">
import Button from 'primevue/button';

interface Props {
  piecePriority: number;
  selected?: boolean;
}
const props = defineProps<Props>();
</script>

<template>
  <Button
    :label="String(props.piecePriority)"
    size="small"
    v-bind="$attrs"
    :class="{
      selected: props.selected,
    }"
  />
</template>

<style scoped>
.selected {
  outline: 2px solid var(--blue-200);
  z-index: 1;
}
</style>
