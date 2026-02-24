/** Wiedza (knowledge/hints) API client. */

import { log } from "../logger.js";
import { BASE_URL } from "../config.js";
import { withRateLimit } from "../rate-limit.js";

export async function fetchHint(
  query: string,
  requestTimes: number[],
): Promise<string> {
  return withRateLimit(async () => {
    const url = `${BASE_URL}/api-wiedza/${encodeURIComponent(query)}`;
    log(`  Request: GET ${url}`);
    const res = await fetch(url);
    const text = await res.text();
    log(
      `  Response (${res.status}) body: ${text.slice(0, 200)}${text.length > 200 ? "..." : ""}`,
    );
    if (!res.ok) return "";
    return text || "";
  }, requestTimes);
}
