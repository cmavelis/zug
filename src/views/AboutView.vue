<script setup lang="ts">
import { LobbyClient } from 'boardgame.io/client';

const lobbyClient = new LobbyClient({ server: 'http://localhost:8000' });

lobbyClient
  .listGames()
  .then(console.log) // => ['chess', 'tic-tac-toe']
  .catch(console.error);

lobbyClient.listMatches('zug').then(console.log);
</script>

<template>
  <div class="about">
    <button>test</button>
  </div>
</template>

<style>
@media (min-width: 1024px) {
  .about {
    min-height: 100vh;
    display: flex;
    align-items: center;
  }
}
button {
  -webkit-appearance: none;
  min-height: 2.5rem;
}
</style>
