import { ref } from 'vue';
import { createOrdersFromString } from '@/game/zugzwang/gameSetup';

export const useTutorialSolution = (
  boardState: any,
  solutionString: string,
) => {
  const showSolution = ref(false);
  const handleShowSolution = () => {
    const solutionOrders = createOrdersFromString(
      boardState.gameState.G,
      solutionString,
    );
    solutionOrders.forEach((solutionOrder) => {
      boardState.client.moves.addOrder(solutionOrder);
    });
    showSolution.value = true;
  };
  return { showSolution, handleShowSolution };
};
