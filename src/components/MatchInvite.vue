<script setup lang="ts">
import Button from 'primevue/button';
import { useToast } from 'primevue/usetoast';

interface MatchInviteProps {
  matchID: string;
}

const props = defineProps<MatchInviteProps>();

const { origin } = window.location;
const link = `${origin}/match/${props.matchID}?join`;

const toast = useToast();
const showCopyMessage = () => {
  toast.add({
    severity: 'info',
    summary: 'Invite link copied',
    detail: link,
    life: 4000,
  });
};

const copyLink = () => {
  navigator.clipboard.writeText(link);
  showCopyMessage();
};
</script>

<template>
  <Button @click="copyLink" size="small" outlined>Copy invite link</Button>
</template>

<style scoped>
button {
  width: fit-content;
}
</style>
