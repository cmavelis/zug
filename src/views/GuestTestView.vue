<script setup lang="ts">
import { ref } from 'vue';

const authToken = ref('');
const userID = ref('');
const result = ref('');

async function loginGuest() {
  result.value = '';
  authToken.value = '';
  userID.value = '';
  try {
    const res = await fetch('/api/guest/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    authToken.value = data.authToken;
    userID.value = data.userID;
    result.value = JSON.stringify(data, null, 2);
  } catch (e) {
    result.value = 'Error: ' + e;
  }
}

async function checkGuest() {
  if (!authToken.value) return;
  try {
    const res = await fetch('/api/guest/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: authToken.value }),
    });
    const data = await res.json();
    result.value = JSON.stringify(data, null, 2);
  } catch (e) {
    result.value = 'Error: ' + e;
  }
}
</script>

<template>
  <div class="guest-test-view">
    <h1>Guest User API Test</h1>
    <button @click="loginGuest">Login as Guest</button>
    <button @click="checkGuest" :disabled="!authToken">
      Check Guest Token
    </button>
    <div v-if="result">
      <h2>Result</h2>
      <pre>{{ result }}</pre>
    </div>
    <div v-if="authToken">
      <h3>Auth Token</h3>
      <pre>{{ authToken }}</pre>
    </div>
    <div v-if="userID">
      <h3>Guest Username</h3>
      <pre data-test="guest-username">{{ userID }}</pre>
    </div>
  </div>
</template>

<style scoped>
.guest-test-view {
  max-width: 600px;
  margin: 2rem auto;
  padding: 2rem;
  border: 1px solid #ccc;
  border-radius: 8px;
}
button {
  margin-right: 1rem;
  margin-bottom: 1rem;
}
pre {
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
}
</style>
