/**
 * In-memory sliding-window rate limiter. Good for a single server process (the recommended
 * VPS deployment). If you run several instances, move this to Redis so limits are shared.
 */
const buckets = new Map<string, number[]>();

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return { ok: false, retryAfterSec: Math.ceil((windowMs - (now - hits[0])) / 1000) };
  }
  hits.push(now);
  buckets.set(key, hits);
  return { ok: true, retryAfterSec: 0 };
}

// Drop idle keys so memory stays bounded with many users.
const sweep = setInterval(() => {
  const now = Date.now();
  for (const [k, hits] of buckets) if (!hits.length || now - hits[hits.length - 1] > 60 * 60 * 1000) buckets.delete(k);
}, 10 * 60 * 1000);
sweep.unref?.();

export const LIMITS = {
  login: { limit: 10, windowMs: 15 * 60 * 1000 },
  register: { limit: 5, windowMs: 60 * 60 * 1000 },
  /** Answer saves etc. A real candidate needs far fewer than this. */
  examApi: { limit: 240, windowMs: 60 * 1000 },
  startTest: { limit: 20, windowMs: 60 * 60 * 1000 },
};
