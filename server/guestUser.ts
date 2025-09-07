import { randomUUID } from 'crypto';

/**
 * Generates a guest username using a character (e.g., '.') not allowed by Clerk.
 * Example output: guest.abc123
 */
export function generateGuestUsername(): string {
  // Use a short UUID (first 6 chars of a v4 UUID)
  const shortId = randomUUID().slice(0, 6);
  return `guest.${shortId}`;
}
