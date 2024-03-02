<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { Ref } from 'vue';
import { useRouter } from 'vue-router';
import { LobbyClient } from 'boardgame.io/client';
import Button from 'primevue/button';
import { DateTime } from 'luxon';

import LobbyMatch from '@/components/LobbyMatch.vue';
import type { GameSetupData } from '@/game/Game';
import { store } from '@/store';
import { getServerURL } from '@/utils';
import { useMatch } from '@/composables/useMatch';
import type { EnhancedMatch } from '../../server/types';
import { DEFAULT_ZUG_CONFIG } from '@/game/zugzwang/config';
import { LobbyAPI } from 'boardgame.io/dist/types/src/types';

const matches: Ref<EnhancedMatch[]> = ref([]);
const server = getServerURL();

// todo: poll match list or show refresh button
const saveMatchList = (matchList: LobbyAPI.MatchList, recent = true) => {
  let matchData = matchList.matches as EnhancedMatch[];
  if (recent) {
    const now = DateTime.now();
    matchData = matchData.filter((m) => {
      const updatedAt = DateTime.fromMillis(m.updatedAt);
      const diffInDays = now.diff(updatedAt, 'days');
      return diffInDays.days < 14;
    });
  }

  matches.value = matchData;
};
const lobbyClient = new LobbyClient({ server });
lobbyClient.listMatches('zug').then(saveMatchList).catch(console.error);

const router = useRouter();
const createMatch = async (
  setupData: GameSetupData = { config: DEFAULT_ZUG_CONFIG },
) => {
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

const handleCustomClick = () => {
  router.push({
    name: 'match-configure',
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
      <Button @click="createMatch()" label="Standard"></Button>
      <Button
        @click="handleCustomClick"
        severity="secondary"
        label="Custom"
      ></Button>
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
          () => requestJoinMatch(match.matchID, undefined, navigateToMatch)
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
</style>
