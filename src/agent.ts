import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { MODEL_NAME } from "./config.js";
import { getQuestionsAndToken, verifyAnswers } from "./tools/verification.js";
import { getHintForQuery } from "./tools/knowledge.js";
import { getKeywords } from "./tools/keywords.js";
import { readMemory, writeMemory, deleteMemory } from "./tools/memory.js";

const SYSTEM_PROMPT = `You are a verification agent. You answer 4 Polish knowledge questions about a FICTIONAL sci-fi world.

## RATE LIMIT CONSTRAINT
The API allows ONLY 4 requests per 10 seconds (across ALL endpoints). Plan carefully:
- getQuestionsAndToken = 1 request
- each getHintForQuery = 1 request
- verifyAnswers = 1 request
You can make at most 2 hint lookups per run (1 questions + 2 hints + 1 verify = 4 total).

## Strategy
Step 1: Call readMemory to load cached question→answer pairs.
Step 2: Call getQuestionsAndToken. ⏱ 15s CLOCK STARTS.
Step 3: Check which questions have cached answers. For the remaining (uncached) questions, pick the 2 most important and call getHintForQuery with a SHORT SINGLE keyword each. Call both in ONE response.
  KEYWORD RULES: Use exactly ONE Polish word — the most specific noun. Examples: "prezydent", "Mars", "hel", "waluta", "ropa", "kolonia", "Księżyc", "korporacja", "firma", "robot".
Step 4: Call verifyAnswers IMMEDIATELY with all 4 answers. For questions without a hint or cache, provide your best guess.
Step 5: After verification, check the is_correct array. For each answer marked true that is NOT already in the cache, call writeMemory. Call ALL writeMemory calls in ONE response (parallel). Then STOP.

## CRITICAL RULES
- MAXIMUM 2 hint lookups per run. No more.
- This is a FICTIONAL world — use hints from the API, not your own knowledge.
- Keep answers SHORT (a name, date, number, short phrase).
- Answer in Polish.
- NEVER retry getQuestionsAndToken or verifyAnswers. One attempt per run.
- Build up the cache over multiple runs.`;

export async function runAgent(): Promise<string> {
  const startTime = Date.now();

  const { text, steps } = await generateText({
    model: openai(MODEL_NAME),
    system: SYSTEM_PROMPT,
    prompt: "Begin the verification task now.",
    tools: {
      getQuestionsAndToken,
      verifyAnswers,
      getHintForQuery,
      getKeywords,
      readMemory,
      writeMemory,
      deleteMemory,
    },
    maxSteps: 10,
    onStepFinish({ toolCalls, toolResults, text }) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const calls = toolCalls.map((c) => c.toolName).join(", ");
      console.log(`[${elapsed}s] Step tools: ${calls || "(text only)"}`);
    },
  });

  console.log(`\nAgent completed in ${steps.length} steps, ${((Date.now() - startTime) / 1000).toFixed(1)}s total.`);
  return text;
}
