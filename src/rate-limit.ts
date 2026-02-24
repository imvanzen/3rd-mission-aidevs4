/** Rate limiter for external API calls (e.g. 4 requests per 10 seconds). */

import { log } from "./logger.js";
import { RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_WINDOW_MS } from "./config.js";

export async function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Runs `fn` only after ensuring we stay under the rate limit.
 * Mutates `requestTimes` (appends current time after waiting).
 */
export async function withRateLimit<T>(
  fn: () => Promise<T>,
  requestTimes: number[],
): Promise<T> {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const recent = requestTimes.filter((t) => t > windowStart);
  if (recent.length >= RATE_LIMIT_MAX_REQUESTS) {
    const waitMs = recent[0]! + RATE_LIMIT_WINDOW_MS - now;
    if (waitMs > 0) {
      log(`  Rate limit: waiting ${(waitMs / 1000).toFixed(1)}s...`);
      await delay(waitMs);
    }
  }
  requestTimes.push(Date.now());
  return fn();
}
