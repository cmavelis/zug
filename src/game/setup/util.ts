export const hasFirstTurnScore = (priorityList: number[]) => {
  if (priorityList[0] < priorityList[1] && priorityList[2] < priorityList[3]) {
    return true;
  }
  if (priorityList[0] > priorityList[1] && priorityList[2] > priorityList[3]) {
    return true;
  }
  return false;
};
