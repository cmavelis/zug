<script setup lang="ts">
import Button from 'primevue/button';
import { useToast } from 'primevue/usetoast';

interface MatchInviteProps {
  matchID: string;
}

const props = defineProps<MatchInviteProps>();

const toast = useToast();

const showCopyMessage = () => {
  toast.add({
    severity: 'info',
    summary: 'Link copied',
    life: 4000,
  });
};

const copyLink = () => {
  navigator.clipboard.writeText(`hello ${props.matchID}`);
  showCopyMessage();
};
</script>

<template>
  <Button @click="copyLink">copy link</Button>
</template>

<style scoped></style>
