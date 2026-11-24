import type { ActivePlayers } from 'boardgame.io/dist/types/src/types';

type MaybeActivePlayers = ActivePlayers | null | undefined;

// Players whose stage just changed to 'planning', i.e. a new turn is waiting on
// them. Moving into any other stage (e.g. 'resolution' after ending a turn)
// doesn't need a "your turn" notification.
export const getPlayersEnteringPlanning = (
  oldActivePlayers: MaybeActivePlayers,
  newActivePlayers: MaybeActivePlayers,
): number[] => {
  if (!(oldActivePlayers && newActivePlayers)) return [];

  return [0, 1].filter(
    (p) =>
      oldActivePlayers[p] !== 'planning' && newActivePlayers[p] === 'planning',
  );
};
