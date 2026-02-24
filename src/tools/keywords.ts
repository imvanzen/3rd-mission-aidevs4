import { generateText, tool } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { MODEL_NAME } from "../config.js";

export const getKeywords = tool({
  description:
    "Extract 1-2 distinct keywords from a sentence that are most useful " +
    "for looking up hints in a knowledge base. Returns comma-separated keywords.",
  parameters: z.object({
    sentence: z.string().describe("The sentence to extract keywords from"),
  }),
  execute: async ({ sentence }) => {
    const { text } = await generateText({
      model: openai(MODEL_NAME),
      system:
        "You are a keyword extractor. Given a question, return 1-2 of the most " +
        "important keywords (nouns, names, or key terms) that would be useful " +
        "for a knowledge-base lookup. Return ONLY the keywords, comma-separated, " +
        "nothing else. Use the original language of the question.",
      prompt: sentence,
    });
    return { keywords: text.trim() };
  },
});
