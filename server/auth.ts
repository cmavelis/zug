import type { MatchTokenPayload } from './types';

import jwt from 'jsonwebtoken';

export const encodeToken = (payload: MatchTokenPayload): string => {
  return jwt.sign(payload, process.env.AUTH_SECRET);
};

export const decodeToken = (token: string): MatchTokenPayload => {
  try {
    return jwt.verify(token, process.env.AUTH_SECRET) as MatchTokenPayload;
  } catch (e) {
    console.error("Couldn't decode token", e);
    throw new Error("Couldn't decode token");
  }
};
