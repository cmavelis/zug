import { ref, watch, type Ref } from 'vue';
import axios from 'axios';

import type { SimulChessClient } from '@/game/App';
import { getMatchData, setMatchData } from '@/composables/useMatch';
import { useClerkUser } from '@/composables/useClerkUser';
import { useUser } from '@/composables/useUser';
import { getServerURL } from '@/utils';

const server = getServerURL();

/**
 * Fetch this user's credentials for a match they already joined, e.g. on
 * another device, and store them locally. Returns the token, or null.
 */
const fetchMatchCredentials = async (
  matchID: string,
  authHeader: string,
): Promise<string | null> => {
  try {
    const resp = await axios.post(
      `${server}/games/zug/${matchID}/credentials`,
      {},
      { headers: { authorization: authHeader } },
    );
    const { playerCredentials } = resp.data;
    if (typeof playerCredentials !== 'string') {
      return null;
    }
    setMatchData(matchID, { token: playerCredentials });
    return playerCredentials;
  } catch (e) {
    console.error('Could not fetch match credentials', e);
    return null;
  }
};

interface MatchCredentialsProps {
  matchID: string;
  matchClient: SimulChessClient;
  playerID: Ref<number | null>;
}

/**
 * Assigns the user to their seat in a match. The server only sends a player's
 * view of the game to clients holding that player's credentials, which are
 * stored per-browser on join. When they're missing locally (e.g. the match
 * was joined on another device), fetch them before assigning the player.
 */
export const useMatchCredentials = ({
  matchID,
  matchClient,
  playerID,
}: MatchCredentialsProps) => {
  const { clerkUsername, clerkToken } = useClerkUser();
  const { guestData } = useUser();

  // set when the user is a player in this match but has no local credentials
  const pendingPlayerID = ref<number | null>(null);
  const credentialStatus = ref<'idle' | 'loading' | 'failed'>('idle');

  const assignPlayer = (joinedPlayerID: number) => {
    if (getMatchData(matchID)?.token) {
      playerID.value = joinedPlayerID;
    } else if (playerID.value === null) {
      pendingPlayerID.value = joinedPlayerID;
    }
  };

  watch(
    [pendingPlayerID, clerkToken, guestData],
    async () => {
      if (pendingPlayerID.value === null || credentialStatus.value !== 'idle') {
        return;
      }
      // signed-in users authenticate with clerk; otherwise use the guest token
      const authHeader = clerkUsername.value
        ? clerkToken.value
        : guestData.value?.token;
      if (!authHeader) {
        // clerk token may arrive later
        return;
      }
      credentialStatus.value = 'loading';
      const token = await fetchMatchCredentials(matchID, authHeader);
      if (token) {
        matchClient.client.updateCredentials(token);
        playerID.value = pendingPlayerID.value;
        pendingPlayerID.value = null;
        credentialStatus.value = 'idle';
      } else {
        credentialStatus.value = 'failed';
      }
    },
    { immediate: true },
  );

  return { assignPlayer, pendingPlayerID, credentialStatus };
};
