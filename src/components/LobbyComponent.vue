<script setup lang="ts">
import { ref, Ref } from 'vue';
import { useRouter } from 'vue-router';
import { LobbyClient } from 'boardgame.io/client';
import { LobbyAPI } from 'boardgame.io/src/types';

const matches: Ref<LobbyAPI.Match[]> = ref([]);

const lobbyClient = new LobbyClient({ server: 'http://localhost:8000' });
lobbyClient
  .listMatches('zug')
  .then((matchList) => {
    matches.value = matchList.matches;
  })
  .catch(console.error);

const router = useRouter();
const createMatch = async () => {
  const createdMatch = await lobbyClient.createMatch('zug', { numPlayers: 2 });
  await router.push({
    name: 'match',
    params: { matchID: createdMatch.matchID },
  });
};
</script>

<template>
  <main>
    <h1>Matches Lobby</h1>
    <p>
      Create or join a match here, or you can navigate to a match URL like
      <RouterLink to="/match/1">/match/1</RouterLink>
      to join an unlisted match.
    </p>
    <button @click="createMatch()">Create new match</button>

    <h2>Current matches:</h2>

    <section
      v-bind:key="match.matchID"
      v-for="match in matches"
      class="matches-list"
    >
      <div class="match-name">{{ match.matchID }}</div>
      <RouterLink class="match-link" :to="`/match/${match.matchID}`"
        >join match</RouterLink
      >
    </section>
  </main>
</template>

<style scoped>
.matches-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.match-name {
  justify-self: right;
}
.match-link {
  justify-self: left;
}
</style>
