import jwt from 'jsonwebtoken';

export const decodeToken = (token: string) => {
  try {
    // @ts-expect-error AUTH_SECRET can be undef
    const decoded = jwt.verify(token, process.env.AUTH_SECRET);
    // `sub` is just from the jwt example
    return decoded.sub;
  } catch (e) {
    console.error("Couldn't decode token", e);
    return 'unauthorized';
  }
};
