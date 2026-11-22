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
  // the seat this token belongs to; absent on entries saved by older versions
  playerID?: number;
}

export const setMatchData = (matchID: string, payload: LocalStorageMatch) => {
  localStorage.setItem(matchID, JSON.stringify(payload));
};

export const getMatchData = (matchID: string): LocalStorageMatch | null => {
  const matchData = localStorage.getItem(matchID);
  if (matchData) {
    return JSON.parse(matchData);
  }
  return null;
};

const server = getServerURL();
const lobbyClient = new LobbyClient({ server });

export const useMatch = (matchID?: string) => {
  const { clerkUsername, getClerkToken } = useClerkUser();

  const { guestData, createNewGuest } = useUser();
  const localMatchData = matchID ? getMatchData(matchID) : null;
  const joinStatus = ref('');
  const requestJoinMatch = async (
    matchID: string,
    setupData?: GameSetupData,
    navigateToMatch?: (matchID: string) => void,
  ) => {
    joinStatus.value = 'loading';
    try {
      let authHeader;
      let playerName;
      const clerkSessionToken = await getClerkToken();
      if (clerkSessionToken) {
        playerName = clerkUsername.value;
        authHeader = clerkSessionToken;
      } else if (guestData.value?.token) {
        playerName = guestData.value.id;
        authHeader = guestData.value.token;
      } else {
        const newGuest = await createNewGuest();
        playerName = newGuest.id;
        authHeader = newGuest.token;
      }
      const resp = await lobbyClient.joinMatch(
        'zug',
        matchID,
        { playerName },
        { headers: { authorization: authHeader } },
      );
      const { playerCredentials } = resp;
      if (playerCredentials) {
        joinStatus.value = 'success';
        setMatchData(matchID, {
          token: playerCredentials,
          playerID: Number(resp.playerID),
        });
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
