<script setup lang="ts">
import BoardComponent from '@/components/BoardComponent.vue';
import { useZugClient } from '@/composables/useZugClient';

const boardStateOne = useZugClient('0');
const boardStateTwo = useZugClient('1');
</script>

<template>
  <BoardComponent
    :client="boardStateOne.client"
    :state="boardStateOne.gameState.G"
    :ctx="boardStateOne.gameState.ctx"
    :config="boardStateOne.gameState.G.config"
    :playerID="boardStateOne.playerID.value"
    :showOrders="boardStateOne.showOrders.value"
    :isActiveTurn="boardStateOne.isActiveTurn"
  />
  <BoardComponent
    :client="boardStateTwo.client"
    :state="boardStateTwo.gameState.G"
    :ctx="boardStateTwo.gameState.ctx"
    :config="boardStateTwo.gameState.G.config"
    :playerID="boardStateTwo.playerID.value"
    :showOrders="boardStateTwo.showOrders.value"
    :isActiveTurn="boardStateTwo.isActiveTurn"
  />
</template>

<style scoped></style>
