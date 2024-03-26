<script setup lang="ts">
import Button from 'primevue/button';

interface Props {
  piecePriority: number;
}
const props = defineProps<Props>();
</script>

<template>
  <Button
    :label="String(props.piecePriority)"
    size="small"
    severity="secondary"
    v-bind="$attrs"
  />
</template>

<style scoped></style>
