<script setup lang="ts">
import LobbyComponent from '@/components/LobbyComponent.vue';
import LoginComponent from '@/components/LoginComponent.vue';
</script>

<template>
  <main>
    <LoginComponent />
    <LobbyComponent></LobbyComponent>
  </main>
</template>

<style>
main {
  text-align: center;
}
.p-inputswitch-slider {
  text-align: initial;
}
</style>
