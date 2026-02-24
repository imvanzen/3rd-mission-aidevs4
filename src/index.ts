import "dotenv/config";
import { log } from "./logger.js";
import { CACHE_FILE } from "./config.js";
import { loadCache, saveCorrectToCache } from "./cache/answer-cache.js";
import { getKeywordFromQuestion } from "./llm/keywords.js";
import { answerQuestion } from "./llm/answers.js";
import { fetchHint } from "./wiedza/client.js";
import {
  fetchQuestionsAndToken,
  submitAnswers,
  TokenExpiredError,
  type WeryfikacjaPostResponse,
} from "./verification/client.js";

async function main(): Promise<void> {
  log("Starting verification...");

  const cache = await loadCache();
  const cacheCount = Object.keys(cache).length;
  if (cacheCount > 0) {
    log(`Loaded ${cacheCount} cached correct answer(s) from ${CACHE_FILE}.`);
  }

  const apiRequestTimes: number[] = [];

  for (;;) {
    let pytania: string[];
    let token: string;
    try {
      const data = await fetchQuestionsAndToken(apiRequestTimes);
      pytania = data.pytania;
      token = data.token;
    } catch (err) {
      log(`Failed to fetch questions: ${err}`);
      process.exit(1);
    }

    const startTime = Date.now();

    // 1. Get keywords for all questions
    log("Getting keywords for questions...");
    const keywords: string[] = [];
    for (let i = 0; i < pytania.length; i++) {
      log(`  [${i + 1}/${pytania.length}] Keyword for: "${pytania[i]!.slice(0, 40)}..."`);
      keywords.push(await getKeywordFromQuestion(pytania[i]!));
    }

    // 2. Get hints for all keywords (rate-limited)
    log("Getting hints for keywords...");
    const hints: string[] = [];
    for (let i = 0; i < keywords.length; i++) {
      log(`  [${i + 1}/${keywords.length}] Fetching hint: "${keywords[i]}"`);
      hints.push(await fetchHint(keywords[i]!, apiRequestTimes));
    }

    // 3. Get answers (use cache when available to save tokens)
    log("Getting answers for questions and hints...");
    const answers: string[] = [];
    for (let i = 0; i < pytania.length; i++) {
      const q = pytania[i]!;
      const cached = cache[q];
      if (cached !== undefined) {
        log(`  [${i + 1}/${pytania.length}] Using cached answer.`);
        answers.push(cached);
      } else {
        log(`  [${i + 1}/${pytania.length}] Answering with LLM...`);
        answers.push(await answerQuestion(q, hints[i] ?? ""));
      }
    }
    log(`All answers ready in ${((Date.now() - startTime) / 1000).toFixed(2)}s`);

    // 4. Verify
    let body: WeryfikacjaPostResponse;
    try {
      body = await submitAnswers(answers, token, apiRequestTimes);
    } catch (err) {
      if (err instanceof TokenExpiredError) {
        log("Token expired, refetching questions and token...");
        continue;
      }
      log(`Verification request failed: ${err}`);
      process.exit(1);
    }

    const status = body.status?.toUpperCase();
    const isCorrect = body.is_correct ?? [];

    // 5. Save correct answers to cache file
    await saveCorrectToCache(cache, pytania, answers, isCorrect);

    if (status === "CORRECT" || status === "OK") {
      log("Verification completed successfully.");
      if (body.flag) log(`Flag: ${body.flag}`);
      process.exit(0);
    }

    log(`Verification failed: status="${body.status}".`);
    if (isCorrect.length) {
      const correctCount = isCorrect.filter(Boolean).length;
      log(`Correct answers: ${correctCount}/${isCorrect.length}`);
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
