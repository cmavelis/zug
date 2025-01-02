<script setup lang="ts">
import { useTemplateRef, onMounted } from 'vue';
import { useClerk } from '@/composables/useClerk';
const { isClerkUser, clerk } = useClerk();

// the first argument must match the ref value in the template
const clerkElement = useTemplateRef('clerk-mount');

onMounted(() => {
  if (isClerkUser) {
    clerk.mountUserButton(clerkElement.value);
  }
});
</script>

<template>
  <div ref="clerk-mount"></div>
</template>

<style scoped></style>
