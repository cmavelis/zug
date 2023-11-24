<script setup lang="ts">
import { computed, ref } from 'vue';
import type { Ref } from 'vue';
import { useRouter } from 'vue-router';
import { LobbyClient } from 'boardgame.io/client';
import type { LobbyAPI } from 'boardgame.io/dist/types/src/types';
import type { GameSetupData } from '@/game/Game';
import { store } from '@/store';

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
  await requestJoinMatch(createdMatch.matchID, setupData);
};

const joinStatus = ref('');
const requestJoinMatch = async (matchID: string, setupData?: GameSetupData) => {
  joinStatus.value = 'loading';
  let authHeader = setupData?.empty ? 'open' : 'error';
  try {
    const resp = await lobbyClient.joinMatch(
      'zug',
      matchID,
      { playerName: store.zugUsername || 'error' },
      { headers: { authorization: store.zugToken || authHeader } },
    );
    console.log(resp);
    if (resp.playerID) {
      joinStatus.value = 'success';
      navigateToMatch(matchID, resp.playerID, setupData);
    } else {
      joinStatus.value = 'failed';
    }
  } catch (e) {
    console.error(e);
    joinStatus.value = 'failed';
  }
};

const navigateToMatch = (
  matchID: string,
  playerID: string,
  setupData?: GameSetupData,
) => {
  router.push({
    name: 'match',
    params: {
      matchID,
    },
    query: {
      player: setupData?.empty ? 9 : Number(playerID) + 1,
    },
  });
};

const usersMatches = computed(() => {
  return matches.value
    .filter((m) =>
      m.players.some((p) => p.name && p.name === store.zugUsername),
    )
    .map((match) => match.matchID);
});
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
    <span>{{ joinStatus }}</span>
    <section class="matches-list">
      <div
        :key="match.matchID"
        :class="{
          match: true,
          highlight: usersMatches.includes(match.matchID),
        }"
        v-for="match in matches"
      >
        <div class="match-name">{{ match.matchID }}</div>
        <div>
          <div :key="player.name" v-for="(player, i) in match.players">
            {{ player.name }}
            <button
              v-if="player.name && player.name === store.zugUsername"
              @click="navigateToMatch(match.matchID, String(i))"
            >
              go to
            </button>
          </div>
        </div>
        <div
          v-if="
            match.players.some((p) => !p.name) &&
            match.players.every((p) => p.name !== store.zugUsername)
          "
        >
          <button @click="requestJoinMatch(match.matchID)">join</button>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.matches-list {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}
.match-name {
  justify-self: right;
}
.match {
  padding: 4px;
}
.highlight {
  border: 2px solid orange;
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
