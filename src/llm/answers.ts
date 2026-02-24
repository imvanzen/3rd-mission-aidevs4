/** LLM-based answer generation from question and optional hint. */

import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

function buildPrompt(question: string, hint: string): string {
  if (hint) {
    return `Kontekst z bazy wiedzy:\n${hint}\n\nPytanie: ${question}\n\nOdpowiedz jednym krótkim zdaniem lub frazą (bez zbędnych wyjaśnień).`;
  }
  return `Pytanie: ${question}\n\nOdpowiedz jednym krótkim zdaniem lub frazą (bez zbędnych wyjaśnień).`;
}

export async function answerQuestion(
  question: string,
  hint: string,
): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set in .env");
  }

  const prompt = buildPrompt(question, hint);

  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    prompt,
    maxTokens: 512,
  });

  return (text || "").trim();
}
