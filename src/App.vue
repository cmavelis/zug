<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router';
import { ref } from 'vue';
import axios from 'axios';

import {
  setUserInStorage,
  removeUserInStorage,
  type ZugUser,
} from '@/utils/auth';
import { store } from '@/store';

const usernameInput = ref('');

const login = async () => {
  const resp = await axios.post('/api/login', {
    username: usernameInput.value,
  });
  if (resp.status === 200) {
    const { data } = resp;
    const { authToken, userID } = data as ZugUser;
    setUserInStorage(data);
    store.setZugToken(authToken);
    store.setZugUsername(userID);
  }
};

const logout = () => {
  removeUserInStorage();
  store.setZugToken('');
  store.setZugUsername('');
};
</script>

<template>
  <header>
    <div class="wrapper">
      <div v-if="store.zugToken">
        <p>hi {{ store.zugUsername }}!</p>
        <button @click="logout">logout</button>
      </div>
      <div v-else>
        <input class="login" v-model="usernameInput" />
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

nav {
  width: 100%;
  font-size: 12px;
  text-align: center;
  margin-bottom: 1rem;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
  border: 0;
}

.login {
  width: 8rem;
}
</style>
