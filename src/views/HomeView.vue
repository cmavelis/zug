<script setup lang="ts">
import { RouterLink } from 'vue-router';
import LobbyComponent from '@/components/LobbyComponent.vue';
const { hostname } = window.location;
</script>

<template>
  <main>
    <RouterLink v-if="hostname === 'localhost'" to="/match/1"
      >Go to Match #1</RouterLink
    >
    <LobbyComponent></LobbyComponent>
  </main>
</template>

<style>
main {
  text-align: center;
}
</style>
