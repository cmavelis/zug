export interface ZugUser {
  username: string;
}

const STORAGE_KEY = 'zug-user';

export const getTokenInStorage = (): string | undefined => {
  return localStorage.getItem(STORAGE_KEY) || undefined;
};

export const setTokenInStorage = (token: string) => {
  localStorage.setItem(STORAGE_KEY, token);
};
