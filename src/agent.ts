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
Step 1: Call readMemory to load cached question→answer pairs from the correct-answers file.
Step 2: Call getQuestionsAndToken. ⏱ 15s CLOCK STARTS.
Step 3: Check which questions have cached answers. For the remaining (uncached) questions, pick the 2 most important and call getHintForQuery with a SHORT SINGLE keyword each. Call both in ONE response.
  KEYWORD RULES: Use exactly ONE Polish word — the most specific noun. Examples: "prezydent", "Mars", "hel", "waluta", "ropa", "kolonia", "Księżyc", "korporacja", "firma", "robot".
Step 4: Call verifyAnswers with all 4 answers (from cache, hints, or best guess). Order must match the questions.
Step 5: After verification:
  - If status is CORRECT: Read the \`flag\` property from the verifyAnswers response and report it — that is the success flag. Then STOP.
  - If status is INCORRECT: For each answer where is_correct[i] is true and not already in cache, call writeMemory (all in ONE response). Then STOP. On the next run, use the knowledge already saved in the correct-answers file (readMemory first) and try again; the cache grows each run until all 4 are correct and you get the flag.
  - After writing new correct answers to memory, STOP.

## CRITICAL RULES
- MAXIMUM 2 hint lookups per run (per attempt). No more.
- This is a FICTIONAL world — use hints from the API, not your own knowledge.
- Keep answers SHORT (a name, date, number, short phrase).
- Answer in Polish.
- When status is CORRECT, always report the \`flag\` from the response.
- When status is INCORRECT, save any newly correct answers (writeMemory). On the next run, rely on readMemory and the correct-answers file to try again; do not give up — keep running until status is CORRECT and you report the flag.
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

  console.log(
    `\nAgent completed in ${steps.length} steps, ${((Date.now() - startTime) / 1000).toFixed(1)}s total.`,
  );
  return text;
}
