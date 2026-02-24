/** Verification API client: fetch questions/token and submit answers. */

import { log } from "../logger.js";
import { BASE_URL } from "../config.js";
import { withRateLimit } from "../rate-limit.js";
import type { WeryfikacjaGetResponse, WeryfikacjaPostResponse } from "./types.js";
import { TokenExpiredError } from "./types.js";

export type { WeryfikacjaPostResponse } from "./types.js";
export { TokenExpiredError } from "./types.js";

export async function fetchQuestionsAndToken(
  apiRequestTimes: number[],
): Promise<{ pytania: string[]; token: string }> {
  log("Request: GET /api-weryfikacja");
  const getRes = await withRateLimit(
    () => fetch(`${BASE_URL}/api-weryfikacja`),
    apiRequestTimes,
  );
  const bodyText = await getRes.text();
  log(`Response (${getRes.status}) body: ${bodyText}`);

  if (!getRes.ok) {
    throw new Error(`GET weryfikacja failed: ${getRes.status} ${getRes.statusText}`);
  }
  const data = JSON.parse(bodyText) as WeryfikacjaGetResponse;
  if (!data.pytania?.length || !data.token) {
    throw new Error("Invalid response: missing pytania or token");
  }
  log(`Received ${data.pytania.length} questions. Token valid for 15s.`);
  return { pytania: data.pytania, token: data.token };
}

export async function submitAnswers(
  odpowiedzi: string[],
  token: string,
  apiRequestTimes: number[],
): Promise<WeryfikacjaPostResponse> {
  const body = { odpowiedzi, token };
  log(`Request: POST /api-weryfikacja body: ${JSON.stringify(body)}`);
  const postRes = await withRateLimit(
    () =>
      fetch(`${BASE_URL}/api-weryfikacja`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    apiRequestTimes,
  );
  const postText = await postRes.text();
  log(`Response (${postRes.status}) body: ${postText || "(empty)"}`);

  if (postRes.status === 403) {
    throw new TokenExpiredError("Token invalid or expired (403).");
  }
  if (!postRes.ok) {
    throw new Error(`HTTP ${postRes.status}: ${postRes.statusText}`);
  }
  return JSON.parse(postText) as WeryfikacjaPostResponse;
}
