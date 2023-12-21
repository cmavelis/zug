<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { Ref } from 'vue';
import { useRouter } from 'vue-router';
import { LobbyClient } from 'boardgame.io/client';
import Button from 'primevue/button';

import LobbyMatch from '@/components/LobbyMatch.vue';
import type { GameSetupData } from '@/game/Game';
import { store } from '@/store';
import { getServerURL } from '@/utils';
import { useMatch } from '@/composables/useMatch';
import type { EnhancedMatch } from '../../server/types';

const matches: Ref<EnhancedMatch[]> = ref([]);
const server = getServerURL();

// todo: poll match list or show refresh button
const lobbyClient = new LobbyClient({ server });
lobbyClient
  .listMatches('zug')
  .then((matchList) => {
    matches.value = matchList.matches as EnhancedMatch[];
  })
  .catch(console.error);

const router = useRouter();
const createMatch = async (setupData: GameSetupData = {}) => {
  const createdMatch = await lobbyClient.createMatch('zug', {
    numPlayers: 2,
    setupData,
    unlisted: setupData?.empty,
  });
  await requestJoinMatch(createdMatch.matchID, setupData, navigateToMatch);
};

const { joinStatus, requestJoinMatch } = useMatch(lobbyClient);

const navigateToMatch = (matchID: string) => {
  router.push({
    name: 'match',
    params: {
      matchID,
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

const yourMatches: Ref<EnhancedMatch[]> = ref([]);
const openMatches: Ref<EnhancedMatch[]> = ref([]);
const remainingMatches: Ref<EnhancedMatch[]> = ref([]);

watch(matches, () => {
  const newYourMatches: EnhancedMatch[] = [];
  const newOpenMatches: EnhancedMatch[] = [];
  const newRemainingMatches: EnhancedMatch[] = [];

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
    <h2>Create a match</h2>
    <span class="p-buttonset">
      <Button @click="createMatch({ priority: 'piece' })">Standard</Button>
      <Button severity="secondary"
        ><RouterLink to="match-configure" class="black-font"
          >Custom</RouterLink
        ></Button
      >
    </span>
    <h2>Matches</h2>
    <span>{{ joinStatus }}</span>
    <h3>Your matches</h3>
    <section class="matches-list">
      <LobbyMatch
        v-for="match in yourMatches"
        :key="match.matchID"
        :match="match"
        :highlight="!match.gameover"
        :handle-match-join="
          () => requestJoinMatch(match.matchID, {}, navigateToMatch)
        "
        :handle-match-navigate="() => navigateToMatch(match.matchID)"
      />
    </section>
    <h3>Open matches</h3>
    <section class="matches-list">
      <LobbyMatch
        v-for="match in openMatches"
        :key="match.matchID"
        :match="match"
        :highlight="usersMatches.includes(match.matchID)"
        :handle-match-join="() => requestJoinMatch(match.matchID)"
        :handle-match-navigate="() => navigateToMatch(match.matchID)"
      />
    </section>
    <h3>Other matches</h3>
    <section class="matches-list">
      <LobbyMatch
        v-for="match in remainingMatches"
        :key="match.matchID"
        :match="match"
        :highlight="usersMatches.includes(match.matchID)"
        :handle-match-join="() => requestJoinMatch(match.matchID)"
        :handle-match-navigate="() => navigateToMatch(match.matchID)"
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
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 4px;
}
button {
  width: fit-content;
}

.black-font {
  color: black;
}

.button-big {
  font-size: 1.5rem;
  margin: 0.5rem;
}
</style>
