const jwt = require('jsonwebtoken');

import { type ZugUser } from '../src/utils/auth';

export const encodeToken = (payload: ZugUser): string => {
  return jwt.sign(payload, process.env.AUTH_SECRET);
};

export const decodeToken = (token: string) => {
  try {
    return jwt.verify(token, process.env.AUTH_SECRET);
  } catch (e) {
    console.error("Couldn't decode token", e);
    throw new Error("Couldn't decode token");
  }
};
