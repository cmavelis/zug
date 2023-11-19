<script setup lang="ts">
import { useRouter } from 'vue-router';
import { setUserInStorage } from '@/utils/auth';
import { store } from '@/store';

const queryString = window.location.search; // Returns:'?q=123'
const params = new URLSearchParams(queryString);
const token = params.get('token');
const userID = params.get('username');

let error = false;
if (token && userID) {
  setUserInStorage({ userID, authToken: token });
  store.setZugToken(token);
  store.setZugUsername(userID);
} else {
  error = true;
}

const router = useRouter();
setTimeout(() => router.push('/'), 3000);
</script>

<template>
  <h1>Discord Login</h1>
  <p v-if="!error">
    You're now logged in with Discord. Redirecting you to the matches page...
  </p>
  <p v-else>
    There was a problem logging you in with Discord. Tell Cam what happened.
  </p>
</template>

<style scoped></style>
