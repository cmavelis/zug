<script>
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
    <h1>This is an about page</h1>
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
</style>
