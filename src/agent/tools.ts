/**
 * AISDK tools for the verification agent.
 * Covers: fetch questions+token, fetch knowledge hints (rate-limited), submit answers.
 */

import { tool } from "ai";
import { z } from "zod";
import { fetchQuestionsAndToken, submitAnswers, TokenExpiredError } from "../verification/client.js";
import { fetchHint } from "../wiedza/client.js";

/** Shared request timestamps for rate limiting across tool calls. Pass the same array when creating tools for one run. */
export type ApiRequestTimes = number[];

/**
 * Creates verification tools bound to a shared rate-limit state.
 * Use one array per verification run so hint requests are rate-limited correctly.
 */
export function createVerificationTools(apiRequestTimes: ApiRequestTimes = []) {
  return {
    getVerificationQuestions: tool({
      description:
        "Fetch the 4 verification questions and a time-limited token. Call this first. The token is valid for 15 seconds; you must call submitVerificationAnswers before it expires.",
      parameters: z.object({}),
      execute: async () => {
        const data = await fetchQuestionsAndToken(apiRequestTimes);
        return {
          pytania: data.pytania,
          token: data.token,
          warning: "Token expires in 15 seconds. Get hints, decide answers, then call submitVerificationAnswers in time.",
        };
      },
    }),

    getKnowledgeHint: tool({
      description:
        "Query the knowledge-base API for a hint matching a keyword. Use one keyword per question (e.g. extracted from the question). Rate-limited: expect delays between calls. Returns empty or a 'no hint' message on 404 or when no hint matches.",
      parameters: z.object({
        query: z.string().describe("Keyword to search for (e.g. from the question text)"),
      }),
      execute: async ({ query }) => {
        const hint = await fetchHint(query, apiRequestTimes);
        return { query, hint: hint || "(no hint found)" };
      },
    }),

    submitVerificationAnswers: tool({
      description:
        "Submit the 4 answers and the token from getVerificationQuestions. Must be called within 15 seconds of receiving the token. Answers must be in the same order as the questions (pytania).",
      parameters: z.object({
        answers: z
          .array(z.string())
          .length(4)
          .describe("Exactly 4 answers, in the same order as the questions"),
        token: z.string().describe("The token returned by getVerificationQuestions"),
      }),
      execute: async ({ answers, token }) => {
        try {
          const result = await submitAnswers(answers, token, apiRequestTimes);
          return result;
        } catch (err) {
          if (err instanceof TokenExpiredError) {
            return {
              error: "token_expired",
              message: "Token invalid or expired. Call getVerificationQuestions again and retry within 15s.",
            };
          }
          throw err;
        }
      },
    }),
  };
}

export type VerificationTools = ReturnType<typeof createVerificationTools>;
