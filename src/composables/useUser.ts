import { ref } from 'vue';

export interface LocalStorageGuest {
  id: string;
  token: string;
}

const guestKey = 'zug-guest-user';

export const useUser = () => {
  const guestData = ref(getGuestData());
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
  return { guestData, setGuestData, createNewGuest };
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
