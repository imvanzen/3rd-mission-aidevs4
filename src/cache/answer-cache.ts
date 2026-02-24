/** Persistent cache of correct question–answer pairs (saves LLM tokens). */

import { readFile, writeFile } from "node:fs/promises";
import { log } from "../logger.js";
import { CACHE_FILE } from "../config.js";

export type AnswerCache = Record<string, string>;

export async function loadCache(): Promise<AnswerCache> {
  try {
    const raw = await readFile(CACHE_FILE, "utf-8");
    const data = JSON.parse(raw) as AnswerCache;
    if (typeof data !== "object" || data === null) return {};
    const out: AnswerCache = {};
    for (const [q, a] of Object.entries(data)) {
      if (typeof q === "string" && typeof a === "string") out[q] = a;
    }
    return out;
  } catch {
    return {};
  }
}

export async function saveCorrectToCache(
  cache: AnswerCache,
  pytania: string[],
  answers: string[],
  isCorrect: boolean[],
): Promise<void> {
  let changed = false;
  for (let i = 0; i < pytania.length; i++) {
    if (isCorrect[i] && pytania[i] && answers[i]) {
      cache[pytania[i]!] = answers[i]!;
      changed = true;
    }
  }
  if (!changed) return;
  await writeFile(CACHE_FILE, JSON.stringify(cache, null, 2), "utf-8");
  log(
    `Saved ${isCorrect.filter(Boolean).length} correct answer(s) to ${CACHE_FILE}`,
  );
}
