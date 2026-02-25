import { tool } from "ai";
import { z } from "zod";
import { BASE_URL } from "../config.js";

export const getQuestionsAndToken = tool({
  description:
    "Fetch 4 verification questions and a token (valid 15 seconds) from the API. " +
    "Call this once at the start — the 15-second countdown begins when you receive the response.",
  parameters: z.object({}),
  execute: async () => {
    const res = await fetch(`${BASE_URL}/api-weryfikacja`);
    const text = await res.text();
    if (!res.ok) {
      return { error: true, httpStatus: res.status, body: text };
    }
    try {
      const body = JSON.parse(text) as { pytania: string[]; token: string };
      return { pytania: body.pytania, token: body.token };
    } catch {
      return { error: true, httpStatus: res.status, body: text };
    }
  },
});

type VerifyAnswersResponse = {
  status: "CORRECT" | "INCORRECT";
  is_correct: boolean[];
  flag: string;
};

export const verifyAnswers = tool({
  description:
    "Submit the 4 answers together with the token. " +
    "The answers array must match the order of the questions received from getQuestionsAndToken.",
  parameters: z.object({
    odpowiedzi: z
      .array(z.string())
      .length(4)
      .describe("Ordered answers for the 4 questions"),
    token: z.string().describe("Token received from getQuestionsAndToken"),
  }),
  execute: async ({ odpowiedzi, token }) => {
    const res = await fetch(`${BASE_URL}/api-weryfikacja`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ odpowiedzi, token }),
    });
    const text = await res.text();
    try {
      console.log(text);
      return JSON.parse(text);
    } catch {
      return { status: "INCORRECT", flag: text };
    }
  },
});
