<script setup lang="ts">
import { useTemplateRef, onMounted } from 'vue';
import { Clerk } from '@clerk/clerk-js';

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const clerk = new Clerk(clerkPubKey);
await clerk.load({
  // Set load options here
});

const isClerkUser = !!clerk.user;

// the first argument must match the ref value in the template
const clerkElement = useTemplateRef('clerk-mount');

onMounted(() => {
  if (isClerkUser) {
    clerk.mountUserButton(clerkElement.value);
  } else {
    clerk.mountSignIn(clerkElement.value);
  }
});
</script>

<template>
  <div ref="clerk-mount"></div>
</template>

<style scoped></style>
