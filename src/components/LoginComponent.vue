<script setup lang="ts">
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

// TODO: temp button
const discordLogin = async () => {
  const resp = await axios.post('/api/login/discord', {
    username: usernameInput.value,
  });
  if (resp.status === 200) {
    const { data } = resp;
    const { redirect } = data;
    window.location.href = redirect;
  }
};

const logout = () => {
  removeUserInStorage();
  store.setZugToken(undefined);
  store.setZugUsername(undefined);
};
</script>

<template>
  <div v-if="store.zugToken" class="account">
    <p>hi {{ store.zugUsername }}!</p>
    <button @click="logout">logout</button>
  </div>
  <div v-else>
    <input class="login" v-model="usernameInput" />
    <button @click="login">name login</button>
    <p>(no password)</p>
    or
    <br />
    <button @click="discordLogin">discord login</button>
  </div>
</template>

<style scoped>
.account {
  display: flex;
  flex-direction: row;
  gap: 1rem;
  margin: 0 auto;
  width: fit-content;
}
.login {
  width: 8rem;
}
</style>
