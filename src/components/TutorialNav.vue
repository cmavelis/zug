<script setup lang="ts">
import { RouterLink } from 'vue-router';
</script>

<template>
  <nav>
    <RouterLink to="/how-to-play">Guide</RouterLink>
    <RouterLink to="/tutorial/1">Tutorial 1</RouterLink>
    <RouterLink to="/tutorial/2">Tutorial 2</RouterLink>
  </nav>
</template>

<style scoped>
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

nav > * {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

nav > *:first-child {
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
