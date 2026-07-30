/** Exponential backoff with jitter. Cap 5 minutes. Max 5 attempts → DEAD. */

export const MAX_ATTEMPTS = 5;
export const BACKOFF_CAP_MS = 5 * 60 * 1000;

export function computeBackoffMs(attemptsAfterFailure: number, now = Date.now()): number {
  const exp = Math.min(2 ** attemptsAfterFailure * 1000, BACKOFF_CAP_MS);
  const jitter = Math.floor(Math.random() * 250);
  return now + Math.min(exp + jitter, BACKOFF_CAP_MS);
}

export function shouldDeadLetter(attempts: number): boolean {
  return attempts >= MAX_ATTEMPTS;
}
