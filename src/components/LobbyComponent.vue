<script setup lang="ts">
import { ref } from 'vue';
import type { Ref } from 'vue';
import { useRouter } from 'vue-router';
import { LobbyClient } from 'boardgame.io/client';
import type { LobbyAPI } from 'boardgame.io/dist/types/src/types';
import type { GameSetupData } from '@/game/Game';

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
const createMatch = async (setupData: GameSetupData = {}) => {
  const createdMatch = await lobbyClient.createMatch('zug', {
    numPlayers: 2,
    setupData,
    unlisted: setupData?.empty,
  });
  await router.push({
    name: 'match',
    params: {
      matchID: createdMatch.matchID,
    },
    query: {
      player: setupData?.empty ? 9 : undefined,
    },
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
    <section class="button-group">
      <h2>Create a match:</h2>
      <button @click="createMatch({ priority: 'piece' })">Standard</button>
      <button @click="createMatch({ priority: 'order-choice' })">
        "Order choice" priority setting
      </button>
      <button @click="createMatch({ empty: true })">Testing</button>
    </section>

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

.button-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
}
button {
  width: fit-content;
}
</style>
