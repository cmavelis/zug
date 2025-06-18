<script setup lang="ts">
import { ref, watch } from 'vue';
import type { Ref } from 'vue';
import { useRouter } from 'vue-router';
import { LobbyClient } from 'boardgame.io/client';
import Button from 'primevue/button';
import { useUser } from '@clerk/vue';

import LobbyMatch from '@/components/LobbyMatch.vue';
import type { GameSetupData } from '@/game/Game';
import { getServerURL } from '@/utils';
import { useMatch } from '@/composables/useMatch';
import type { EnhancedMatch } from '../../server/types';
import { DEFAULT_ZUG_CONFIG, LATEST_ZUG_CONFIG } from '@/game/zugzwang/config';
import { type LobbyAPI } from 'boardgame.io';

const matches: Ref<EnhancedMatch[]> = ref([]);
const lastFetched = ref();
const server = getServerURL();
const { user } = useUser();

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
});

const saveMatchList = (matchList: LobbyAPI.MatchList) => {
  let matchData = matchList.matches as EnhancedMatch[];
  matchData.sort((a, b) => {
    return b.updatedAt - a.updatedAt;
  });
  matches.value = matchData;
  lastFetched.value = dateFormatter.format(new Date());
};
const lobbyClient = new LobbyClient({ server });
const fetchMatches = () => {
  lobbyClient.listMatches('zug').then(saveMatchList).catch(console.error);
};
fetchMatches();
// polling too expensive right now
// setInterval(fetchMatches, 10000);

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

const shouldHighlight = (match: EnhancedMatch) => {
  const { activePlayers, players, gameover } = match;

  let yourTurn;
  if (activePlayers) {
    const playerIndex = Object.values(players).findIndex(
      (player) => player.name === user.value?.username,
    );
    yourTurn = activePlayers[playerIndex] === 'planning';
  }

  return yourTurn && !gameover;
};

const yourMatches: Ref<EnhancedMatch[]> = ref([]);
const openMatches: Ref<EnhancedMatch[]> = ref([]);
const remainingMatches: Ref<EnhancedMatch[]> = ref([]);

watch([matches, user], () => {
  const newYourMatches: EnhancedMatch[] = [];
  const newOpenMatches: EnhancedMatch[] = [];
  const newRemainingMatches: EnhancedMatch[] = [];

  matches.value.forEach((match) => {
    if (
      match.players.some((p) => p.name && p.name === user.value?.username) &&
      newYourMatches.length < 6
    ) {
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
      <Button @click="createMatch()" label="Basic"></Button>
      <Button
        @click="createMatch({ config: LATEST_ZUG_CONFIG })"
        label="Advanced"
      ></Button>
      <Button
        @click="handleCustomClick"
        severity="secondary"
        label="Custom"
      ></Button>
    </span>
    <div class="matches-header">
      <Button
        size="small"
        label="Refresh"
        :onclick="fetchMatches"
        style="justify-self: end"
      />
      <h2>Matches</h2>
      <div class="center-align">Last refreshed: {{ lastFetched }}</div>
    </div>
    <span>{{ joinStatus }}</span>
    <div class="divider">
      <h3>Your matches</h3>
      <Button
        data-tooltip="Shows your 6 most recent games, highlighting ones where it's your turn"
        tabindex="0"
        icon="pi pi-question"
        severity="secondary"
        v-tooltip.top="
          'Shows your 6 most recent games, highlighting ones where it\'s your turn'
        "
        :pt="{ root: { class: 'tooltip-button' } }"
        class="mobile-tooltip"
      />
    </div>
    <section class="matches-list">
      <LobbyMatch
        v-for="match in yourMatches"
        :key="match.matchID"
        :match="match"
        :highlight="shouldHighlight(match)"
        :handle-match-join="
          () => requestJoinMatch(match.matchID, undefined, navigateToMatch)
        "
        :handle-match-navigate="() => navigateToMatch(match.matchID)"
      />
    </section>
    <div class="divider"><h3>Open matches</h3></div>
    <section class="matches-list">
      <LobbyMatch
        v-for="match in openMatches"
        :key="match.matchID"
        :match="match"
        :handle-match-join="
          () => requestJoinMatch(match.matchID, undefined, navigateToMatch)
        "
        :handle-match-navigate="() => navigateToMatch(match.matchID)"
      />
    </section>
    <div class="divider"><h3>Other matches</h3></div>
    <section class="matches-list">
      <LobbyMatch
        v-for="match in remainingMatches"
        :key="match.matchID"
        :match="match"
        :handle-match-join="
          () => requestJoinMatch(match.matchID, undefined, navigateToMatch)
        "
        :handle-match-navigate="() => navigateToMatch(match.matchID)"
      />
    </section>
  </main>
</template>

<style scoped>
.divider {
  display: flex;
  white-space: nowrap;
  gap: 8px;
  align-items: center;
}

.divider:before {
  display: block;
  content: '';
  width: 100%;
  border-top: 1px solid var(--color-text);
}

.divider:after {
  display: block;
  content: '';
  width: 100%;
  border-top: 1px solid var(--color-text);
}

.matches-list {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.matches-header {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  align-items: center;
}

.center-align {
  display: flex;
  align-items: center;
  gap: 4px;
}

.button-group {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 4px;
}

.tooltip-button {
  padding: 0.4rem;
  z-index: 1;
}
</style>
