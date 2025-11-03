export interface LocalStorageGuest {
  id: string;
  token: string;
}

const guestKey = 'zug-guest-user';

export const useUser = () => {
  const guestData = getGuestData();
  return { guestData, setGuestData };
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
