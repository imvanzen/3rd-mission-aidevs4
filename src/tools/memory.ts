import { tool } from "ai";
import { z } from "zod";
import { readFile, writeFile } from "node:fs/promises";
import { CACHE_FILE } from "../config.js";

type MemoryStore = Record<string, string>;

let writeLock = Promise.resolve();

async function loadStore(): Promise<MemoryStore> {
  try {
    const raw = await readFile(CACHE_FILE, "utf-8");
    return JSON.parse(raw) as MemoryStore;
  } catch {
    return {};
  }
}

async function saveStore(store: MemoryStore): Promise<void> {
  await writeFile(CACHE_FILE, JSON.stringify(store, null, 2), "utf-8");
}

function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const prev = writeLock;
  let resolve: () => void;
  writeLock = new Promise<void>((r) => (resolve = r));
  return prev.then(fn).finally(() => resolve!());
}

export const readMemory = tool({
  description:
    "Read all cached question-answer pairs from file memory. " +
    "Returns a JSON object mapping questions to their known correct answers. " +
    "Call this before fetching questions to check for cached answers.",
  parameters: z.object({}),
  execute: async () => {
    const store = await loadStore();
    return { entries: store, count: Object.keys(store).length };
  },
});

export const writeMemory = tool({
  description:
    "Save a question-answer pair to file memory for future reuse. " +
    "Use this after verification succeeds to cache correct answers.",
  parameters: z.object({
    question: z.string().describe("The question text"),
    answer: z.string().describe("The correct answer"),
  }),
  execute: ({ question, answer }) =>
    withLock(async () => {
      const store = await loadStore();
      store[question] = answer;
      await saveStore(store);
      return { saved: true, question, answer };
    }),
});

export const deleteMemory = tool({
  description:
    "Remove a question-answer pair from file memory. " +
    "Use this if a cached answer turned out to be wrong.",
  parameters: z.object({
    question: z.string().describe("The question text to remove"),
  }),
  execute: ({ question }) =>
    withLock(async () => {
      const store = await loadStore();
      const existed = question in store;
      delete store[question];
      await saveStore(store);
      return { deleted: existed, question };
    }),
});
