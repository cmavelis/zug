<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router';
import { ref } from 'vue';
import axios from 'axios';

import { setTokenInStorage } from '@/utils/auth';
import { store } from '@/store';

const usernameInput = ref('');

const login = async () => {
  const resp = await axios.post('/api/login', {
    username: usernameInput.value,
  });
  console.log(resp);
  if (resp.status === 200) {
    setTokenInStorage(resp.data);
    store.setZugToken(resp.data);
  }
};
</script>

<template>
  <header>
    <div class="wrapper">
      <p v-if="store.zugToken">welcome back!</p>
      <div v-else>
        <input v-model="usernameInput" />
        <button @click="login">login</button>
      </div>

      <nav>
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/how-to-play">How To Play</RouterLink>
        <RouterLink to="/about">About</RouterLink>
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

.logo {
  display: block;
  margin: 0 auto 2rem;
}

nav {
  width: 100%;
  font-size: 12px;
  text-align: center;
  margin-bottom: 1rem;
}

nav a.router-link-exact-active {
  color: var(--color-text);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
  border: 0;
}
</style>
