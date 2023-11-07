export interface ZugUser {
  username: string;
}

const STORAGE_KEY = 'zug-user';

export const getTokenInStorage = (): string | null => {
  return localStorage.getItem(STORAGE_KEY);
};

export const setTokenInStorage = (token: string) => {
  localStorage.setItem(STORAGE_KEY, token);
};
