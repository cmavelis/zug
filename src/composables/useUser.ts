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
    const data = await res.json();
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
