import { ref } from 'vue';
import { type GameSetupData } from '@/game/Game';
import { LobbyClient } from 'boardgame.io/client';

import router from '@/router';
import { useClerkUser } from '@/composables/useClerkUser';
import { getServerURL } from '@/utils';
import { useUser } from '@/composables/useUser';

export const navigateToMatch = async (matchID: string) => {
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

export interface LocalStorageMatch {
  token: string;
}

const setMatchData = (matchID: string, payload: LocalStorageMatch) => {
  localStorage.setItem(matchID, JSON.stringify(payload));
};

const getMatchData = (matchID: string): LocalStorageMatch | null => {
  const matchData = localStorage.getItem(matchID);
  if (matchData) {
    return JSON.parse(matchData);
  }
  return null;
};

const server = getServerURL();
const lobbyClient = new LobbyClient({ server });

export const useMatch = (matchID?: string) => {
  const { clerkToken, clerkUsername } = useClerkUser();

  const { guestData } = useUser();
  const localMatchData = matchID ? getMatchData(matchID) : null;
  const joinStatus = ref('');
  const requestJoinMatch = async (
    matchID: string,
    setupData?: GameSetupData,
    navigateToMatch?: (matchID: string) => void,
  ) => {
    let authHeader = setupData?.empty ? 'open' : 'error';
    let playerName = 'error';
    if (clerkToken.value) {
      console.log('using clerkToken', clerkToken.value);
      playerName = clerkUsername.value;
      authHeader = clerkToken.value;
    } else if (guestData?.token) {
      console.log('using guestData', guestData);
      playerName = guestData.id;
      authHeader = guestData.token;
    }
    joinStatus.value = 'loading';
    try {
      const resp = await lobbyClient.joinMatch(
        'zug',
        matchID,
        { playerName },
        { headers: { authorization: authHeader } },
      );
      const { playerCredentials } = resp;
      if (playerCredentials) {
        joinStatus.value = 'success';
        setMatchData(matchID, { token: playerCredentials });
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

  return { joinStatus, requestJoinMatch, navigateToMatch, localMatchData };
};
