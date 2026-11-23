import { ref, type Ref } from 'vue';
import axios from 'axios';

import type { SimulChessClient } from '@/game/App';
import { getMatchData, setMatchData } from '@/composables/useMatch';
import { useClerkUser } from '@/composables/useClerkUser';
import { useUser } from '@/composables/useUser';
import { getServerURL } from '@/utils';

const server = getServerURL();

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
  const { clerkUsername, getClerkToken } = useClerkUser();
  const { guestData } = useUser();

  const credentialStatus = ref<'idle' | 'loading' | 'failed'>('idle');

  const fetchCredentials = async () => {
    credentialStatus.value = 'loading';
    try {
      // signed-in users authenticate with clerk; otherwise use the guest token
      const authHeader = clerkUsername.value
        ? await getClerkToken()
        : guestData.value?.token;
      if (!authHeader) {
        throw new Error('No auth token available');
      }
      const { data } = await axios.post(
        `${server}/games/zug/${matchID}/credentials`,
        {},
        { headers: { authorization: authHeader } },
      );
      if (
        typeof data.playerCredentials !== 'string' ||
        typeof data.playerID !== 'string'
      ) {
        throw new Error('Invalid credentials response');
      }
      const seat = Number(data.playerID);
      setMatchData(matchID, { token: data.playerCredentials, playerID: seat });
      matchClient.client.updateCredentials(data.playerCredentials);
      playerID.value = seat;
      credentialStatus.value = 'idle';
    } catch (e) {
      console.error('Could not fetch match credentials', e);
      credentialStatus.value = 'failed';
    }
  };

  const assignPlayer = (joinedPlayerID: number) => {
    const stored = getMatchData(matchID);
    const hasSeatToken =
      stored?.token &&
      (stored.playerID === undefined || stored.playerID === joinedPlayerID);

    if (hasSeatToken) {
      playerID.value = joinedPlayerID;
    } else if (
      playerID.value === null &&
      credentialStatus.value !== 'loading'
    ) {
      fetchCredentials();
    }
  };

  return { assignPlayer, credentialStatus };
};
