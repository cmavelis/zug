<script setup lang="ts">
import { ref, watch } from 'vue';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import { useToast } from 'primevue/usetoast';
import QRCode from 'qrcode';

interface MatchInviteProps {
  matchID: string;
}

const props = defineProps<MatchInviteProps>();

const QRVisible = ref(false);
const canvas = ref(null);

const { origin } = window.location;
const link = `${origin}/match/${props.matchID}`;

const toast = useToast();
const showCopyMessage = () => {
  toast.add({
    severity: 'info',
    summary: 'Match link copied',
    detail: link,
    life: 4000,
  });
};

const copyLink = () => {
  navigator.clipboard.writeText(link);
  showCopyMessage();
};

watch(canvas, () => {
  if (canvas.value) {
    QRCode.toCanvas(canvas.value, link, function (error) {
      if (error) console.error(error);
      console.log('success!');
    });
  }
});

const handeShowQR = () => {
  QRVisible.value = true;
};
</script>

<template>
  <Dialog
    v-model:visible="QRVisible"
    modal
    :header="`zug match: ${matchID}`"
    :style="{ width: '50rem', textAlign: 'center' }"
    :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
  >
    <canvas ref="canvas"></canvas>
  </Dialog>
  <span class="p-buttonset">
    <Button
      icon="pi pi-link"
      outlined
      @click="copyLink"
      size="small"
      :pt="{
        icon: { style: 'font-size: 1.2rem' },
      }"
    />
    <Button
      icon="pi pi-qrcode"
      outlined
      @click="handeShowQR"
      size="small"
      :pt="{
        icon: { style: 'font-size: 1.2rem' },
      }"
    />
  </span>
</template>

<style scoped></style>
