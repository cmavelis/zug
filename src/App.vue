<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router';
import { store } from './store';
import Toast from 'primevue/toast';
import { BOARD_PIXEL_SIZE } from '@/constants';
import Logo from '@/assets/logo.svg';

const squareSize = BOARD_PIXEL_SIZE + 'px';
const root = document.querySelector(':root');
// @ts-expect-error
root.style.setProperty('--square-size', squareSize);
</script>

<template>
  <Toast />
  <header>
    <div class="wrapper">
      <nav>
        <RouterLink to="/"><Logo class="logo"></Logo></RouterLink>
        <RouterLink to="/how-to-play">How To Play</RouterLink>
        <RouterLink to="/about">About</RouterLink>
        <span>{{ store.zugUsername }}</span>
      </nav>
    </div>
  </header>

  <RouterView />
</template>

<style>
.logo path {
  transition-property: stroke, fill;
  transition-duration: 0.5s;
  stroke: black !important;
  fill: var(--color-theme-primary) !important;
}
.logo:hover path {
  stroke: #cbd5e1 !important;
  fill: var(--tekhelet) !important;
}
</style>

<style scoped>
header {
  line-height: 1.5;
  max-height: 100vh;
}

.logo {
  transition-property: background-color;
  transition-duration: 0.5s;
  padding: 4px;
  border-radius: 4px;
  display: block;
  background-color: var(--color-theme-primary);
  width: 36px;
  height: 36px;
}

.logo:hover {
  background-color: var(--tekhelet);
}

nav {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
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

a {
  color: var(--color-theme-primary);
  transition: 0.4s;
}

@media (hover: hover) {
  a:hover:not(:first-child) {
    background-color: var(--link-hover-color);
  }
}
</style>
