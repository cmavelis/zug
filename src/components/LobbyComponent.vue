<script setup lang="ts">
import { ref, Ref } from 'vue';
import { useRouter } from 'vue-router';
import { LobbyClient } from 'boardgame.io/client';
import { LobbyAPI } from 'boardgame.io/dist/types/src/types';

const matches: Ref<LobbyAPI.Match[]> = ref([]);
const { protocol, hostname, port } = window.location;
const server = `${protocol}//${hostname}:${port}`;

const lobbyClient = new LobbyClient({ server });
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

    <h2>Open matches:</h2>

    <section :key="match.matchID" v-for="match in matches" class="matches-list">
      <div class="match-name">{{ match.matchID }}</div>
      <div class="match-link">
        <RouterLink :to="`/match/${match.matchID}?player=1`"
          >player 1</RouterLink
        ><RouterLink :to="`/match/${match.matchID}?player=2`"
          >player 2</RouterLink
        >
      </div>
    </section>
  </main>
</template>

<style scoped>
.matches-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.match-name {
  justify-self: right;
}
.match-link {
  display: flex;
  gap: 8px;
  justify-self: left;
}
</style>
