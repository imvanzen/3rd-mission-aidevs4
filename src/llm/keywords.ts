/** LLM-based keyword extraction from questions (for hint lookup). */

import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

const KEYWORD_PROMPT = (question: string) =>
  `Pytanie: ${question}

Wyciągnij JEDNO słowo kluczowe lub krótką frazę (1-3 słowa), które najlepiej identyfikuje temat pytania i będzie dobre do wyszukania w bazie wiedzy. Odpowiedz TYLKO tym słowem/frazą, bez cudzysłowów i bez dodatkowego opisu.`;

export async function getKeywordFromQuestion(question: string): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set in .env");
  }

  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    prompt: KEYWORD_PROMPT(question),
    maxTokens: 30,
  });

  const keyword = (text || "").trim().slice(0, 50);
  return keyword || question.slice(0, 30);
}
