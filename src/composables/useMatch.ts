import { ref } from 'vue';
import { type GameSetupData } from '@/game/Game';
import type { LobbyClient } from 'boardgame.io/client';
import router from '@/router';
import { Clerk } from '@clerk/clerk-js';

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

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

export const useMatch = (lobbyClient: LobbyClient) => {
  const joinStatus = ref('');
  const requestJoinMatch = async (
    matchID: string,
    setupData?: GameSetupData,
    navigateToMatch?: (matchID: string) => void,
  ) => {
    const clerk = new Clerk(clerkPubKey);
    await clerk.load();
    if (!clerk.session) {
      console.error('no clerk session');
      joinStatus.value = 'failed';
      return;
    }
    const token = await clerk.session.getToken();
    joinStatus.value = 'loading';
    const authHeader = setupData?.empty ? 'open' : 'error';
    try {
      const resp = await lobbyClient.joinMatch(
        'zug',
        matchID,
        { playerName: clerk.session.user.username || 'error' },
        { headers: { authorization: token || authHeader } },
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
