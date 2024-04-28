<script setup lang="ts">
import { store } from '@/store';
import type { EnhancedMatch } from '../../server/types';
import Button from 'primevue/button';

interface LobbyMatchProps {
  match: EnhancedMatch;
  handleMatchJoin: () => any;
  handleMatchNavigate: () => void;
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
    <div class="match-header">
      <Button
        icon="pi pi-eye"
        outlined
        size="small"
        :pt="{ root: { class: 'match-spectate-button' } }"
        @click="() => handleMatchNavigate()"
      />
      <div class="match-name">{{ props.match.matchID }}</div>
    </div>

    <div>
      <div :key="player.name" v-for="(player, i) in props.match.players">
        ({{ props.match.score[i as 0 | 1] }})
        {{ player.name }}
        <button
          v-if="player.name && player.name === store.zugUsername"
          @click="() => handleMatchNavigate()"
        >
          go to
        </button>
      </div>
    </div>
    <div
      v-if="
        props.match.players.some((p) => !p.name) &&
        props.match.players.every((p) => p.name !== store.zugUsername)
      "
    >
      <button @click="handleMatchJoin">join</button>
    </div>
    <p>turn {{ props.match.turn }}</p>
  </div>
</template>

<style scoped>
.match-header {
  display: flex;
  gap: 4px;
  align-items: center;
}
.match-spectate-button {
  width: unset;
  padding: 0.4rem;
}
.match-name {
  justify-self: right;
}
.match {
  padding: 4px;
  border-radius: 4px;
}
.highlight {
  box-shadow:
    0 0 5px var(--color-theme-primary),
    0 0 7px var(--tekhelet);
  border: 1px solid var(--color-theme-primary);
}
</style>
