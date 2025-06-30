import { ref } from 'vue';
import { type GameSetupData } from '@/game/Game';
import type { LobbyClient } from 'boardgame.io/client';
import router from '@/router';
import { useClerkUser } from '@/composables/useClerkUser';

const navigateToMatch = async (matchID: string) => {
  try {
    return await router.push({
      name: 'match',
      params: {
        matchID,
      },
    });
  } catch (message) {
    return console.error(message);
  }
};

export const useMatch = (lobbyClient: LobbyClient) => {
  const { clerkToken, clerkUsername } = useClerkUser();
  const joinStatus = ref('');
  const requestJoinMatch = async (
    matchID: string,
    setupData?: GameSetupData,
    navigateToMatch?: (matchID: string) => void,
  ) => {
    if (!clerkToken) {
      joinStatus.value = 'failed';
      return;
    }
    joinStatus.value = 'loading';
    const authHeader = setupData?.empty ? 'open' : 'error';
    try {
      const resp = await lobbyClient.joinMatch(
        'zug',
        matchID,
        { playerName: clerkUsername.value || 'error' },
        { headers: { authorization: clerkToken.value || authHeader } },
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

  return { joinStatus, requestJoinMatch, navigateToMatch };
};
