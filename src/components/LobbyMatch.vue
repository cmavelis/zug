<script setup lang="ts">
import { store } from '@/store';
import type { LobbyAPI } from 'boardgame.io';

interface LobbyMatchProps {
  players: LobbyAPI.Match['players'];
  matchID: string;
  handleMatchJoin: () => any;
  handleMatchNavigate: (playerNumber: string) => void;
  highlight?: boolean;
}

const props = defineProps<LobbyMatchProps>();
</script>

<template>
  <div
    :class="{
      match: true,
      highlight: props.highlight,
    }"
  >
    <div class="match-name">{{ props.matchID }}</div>
    <div>
      <div :key="player.name" v-for="(player, i) in props.players">
        {{ player.name }}
        <button
          v-if="player.name && player.name === store.zugUsername"
          @click="() => handleMatchNavigate(String(i))"
        >
          go to
        </button>
      </div>
    </div>
    <div
      v-if="
        props.players.some((p) => !p.name) &&
        props.players.every((p) => p.name !== store.zugUsername)
      "
    >
      <button @click="handleMatchJoin">join</button>
    </div>
  </div>
</template>

<style scoped>
.match-name {
  justify-self: right;
}
.match {
  padding: 4px;
}
.highlight {
  border: 2px solid orange;
}
</style>
