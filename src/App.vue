<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router';
import { store } from './store';
import { BOARD_PIXEL_SIZE } from '@/constants';

const squareSize = BOARD_PIXEL_SIZE + 'px';
const root = document.querySelector(':root');
root.style.setProperty('--square-size', squareSize);
</script>

<template>
  <header>
    <div class="wrapper">
      <nav>
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/how-to-play">How To Play</RouterLink>
        <RouterLink to="/about">About</RouterLink>
        <span>{{ store.zugUsername }}</span>
      </nav>
    </div>
  </header>

  <RouterView />
</template>

<style scoped>
header {
  line-height: 1.5;
  max-height: 100vh;
}

nav {
  width: 100%;
  font-size: 12px;
  text-align: center;
  margin-bottom: 1rem;
}

nav * {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

nav *:first-child {
  border: 0;
}
</style>
