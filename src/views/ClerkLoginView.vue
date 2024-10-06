<script setup lang="ts">
import ClerkLogin from '@/components/login/ClerkLogin.vue';
</script>

<template>
  <Suspense>
    <ClerkLogin></ClerkLogin>
    <template #fallback> Loading... </template>
  </Suspense>
</template>

<style scoped></style>
