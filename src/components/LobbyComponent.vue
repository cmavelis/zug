<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { Ref } from 'vue';
import { useRouter } from 'vue-router';
import { LobbyClient } from 'boardgame.io/client';
import type { LobbyAPI } from 'boardgame.io/dist/types/src/types';
import LobbyMatch from '@/components/LobbyMatch.vue';
import type { GameSetupData } from '@/game/Game';
import { store } from '@/store';

const matches: Ref<LobbyAPI.Match[]> = ref([]);
const { protocol, hostname, port } = window.location;
const server = `${protocol}//${hostname}:${port}`;

// todo: poll match list or show refresh button
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

const yourMatches: Ref<LobbyAPI.Match[]> = ref([]);
const openMatches: Ref<LobbyAPI.Match[]> = ref([]);
const remainingMatches: Ref<LobbyAPI.Match[]> = ref([]);

watch(matches, () => {
  const newYourMatches: LobbyAPI.Match[] = [];
  const newOpenMatches: LobbyAPI.Match[] = [];
  const newRemainingMatches: LobbyAPI.Match[] = [];

  matches.value.forEach((match) => {
    if (match.players.some((p) => p.name && p.name === store.zugUsername)) {
      newYourMatches.push(match);
    } else if (match.players.some((p) => !p.name)) {
      newOpenMatches.push(match);
    } else {
      newRemainingMatches.push(match);
    }
  });
  yourMatches.value = newYourMatches;
  openMatches.value = newOpenMatches;
  remainingMatches.value = newRemainingMatches;
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
      <button @click="createMatch({ outOfBounds: 'turn-end' })">
        Standard + "Greatest"
      </button>
      <button @click="createMatch({ priority: 'order-choice' })">
        "Action order" priority setting
      </button>
      <button @click="createMatch({ empty: true })">Testing</button>
    </section>

    <h2>Matches</h2>
    <span>{{ joinStatus }}</span>
    <h3>Your matches:</h3>
    <section class="matches-list">
      <LobbyMatch
        v-for="match in yourMatches"
        :key="match.matchID"
        :matchID="match.matchID"
        :players="match.players"
        :highlight="!match.gameover"
        :handle-match-join="() => requestJoinMatch(match.matchID)"
        :handle-match-navigate="
          (playerName: string) => navigateToMatch(match.matchID, playerName)
        "
      />
    </section>
    <h3>Open matches:</h3>
    <section class="matches-list">
      <LobbyMatch
        v-for="match in openMatches"
        :key="match.matchID"
        :matchID="match.matchID"
        :players="match.players"
        :highlight="usersMatches.includes(match.matchID)"
        :handle-match-join="() => requestJoinMatch(match.matchID)"
        :handle-match-navigate="
          (playerName: string) => navigateToMatch(match.matchID, playerName)
        "
      />
    </section>
    <h3>Other matches:</h3>
    <section class="matches-list">
      <LobbyMatch
        v-for="match in remainingMatches"
        :key="match.matchID"
        :matchID="match.matchID"
        :players="match.players"
        :highlight="usersMatches.includes(match.matchID)"
        :handle-match-join="() => requestJoinMatch(match.matchID)"
        :handle-match-navigate="
          (playerName: string) => navigateToMatch(match.matchID, playerName)
        "
      />
    </section>
  </main>
</template>

<style scoped>
.matches-list {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 1rem;
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
