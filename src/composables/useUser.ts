import { computed, ref } from 'vue';
import { useClerkUser } from '@/composables/useClerkUser';

export interface LocalStorageGuest {
  id: string;
  token: string;
}

const guestKey = 'zug-guest-user';

export const useUser = () => {
  const guestData = ref(getGuestData());
  const { clerkUsername } = useClerkUser();

  const createNewGuest = async () => {
    const res = await fetch('/api/guest/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    let data: unknown;
    try {
      data = await res.json();
    } catch {
      throw new Error(`Failed to parse guest response (${res.status})`);
    }

    if (!res.ok) {
      const message = hasErrorMessage(data)
        ? data.message
        : `Failed to create guest (${res.status})`;
      throw new Error(message);
    }

    if (!isGuestResponse(data)) {
      throw new Error('Invalid guest data received from server');
    }

    const formattedData = { id: data.userID, token: data.authToken };
    guestData.value = formattedData;
    setGuestData(formattedData);
    return formattedData;
  };

  const userName = computed(() => clerkUsername.value || guestData.value?.id);

  return { guestData, setGuestData, createNewGuest, userName };
};
const setGuestData = (payload: LocalStorageGuest) => {
  localStorage.setItem(guestKey, JSON.stringify(payload));
};

const getGuestData = (): LocalStorageGuest | null => {
  const data = localStorage.getItem(guestKey);
  if (data) {
    return JSON.parse(data);
  }
  return null;
};

const isGuestResponse = (
  payload: unknown,
): payload is { userID: string; authToken: string } => {
  if (
    typeof payload !== 'object' ||
    payload === null ||
    !('userID' in payload) ||
    !('authToken' in payload)
  ) {
    return false;
  }

  const { userID, authToken } = payload as Record<string, unknown>;
  return typeof userID === 'string' && typeof authToken === 'string';
};

const hasErrorMessage = (payload: unknown): payload is { message: string } => {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'message' in payload &&
    typeof (payload as { message: unknown }).message === 'string'
  );
};
