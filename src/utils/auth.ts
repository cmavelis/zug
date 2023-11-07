export interface ZugUser {
  userID: string;
  authToken: string;
}

const STORAGE_KEY = 'zug-user';

export const getUserInStorage = (): ZugUser | undefined => {
  const stringifiedUser = localStorage.getItem(STORAGE_KEY);
  if (!stringifiedUser) return undefined;
  return JSON.parse(stringifiedUser);
};

export const setUserInStorage = (payload: ZugUser) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
};
