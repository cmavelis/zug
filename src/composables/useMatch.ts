import { ref } from 'vue';
import { type GameSetupData } from '@/game/Game';
import { store } from '@/store';
import type { LobbyClient } from 'boardgame.io/client';

export const useMatch = (lobbyClient: LobbyClient) => {
  const joinStatus = ref('');
  const requestJoinMatch = async (
    matchID: string,
    setupData?: GameSetupData,
    navigateToMatch?: (matchID: string) => void,
  ) => {
    joinStatus.value = 'loading';
    const authHeader = setupData?.empty ? 'open' : 'error';
    try {
      const resp = await lobbyClient.joinMatch(
        'zug',
        matchID,
        { playerName: store.zugUsername || 'error' },
        { headers: { authorization: store.zugToken || authHeader } },
      );
      if (resp.playerID) {
        joinStatus.value = 'success';
        if (navigateToMatch) {
          navigateToMatch(matchID);
        }
        return resp;
      } else {
        joinStatus.value = 'failed';
      }
    } catch (e) {
      console.error(e);
      joinStatus.value = 'failed';
    }
  };

  return { joinStatus, requestJoinMatch };
};
