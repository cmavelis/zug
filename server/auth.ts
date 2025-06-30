const jwt = require('jsonwebtoken');

export const encodeToken = (payload: { credentials: string }): string => {
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
