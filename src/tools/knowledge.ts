import { tool } from "ai";
import { z } from "zod";
import { BASE_URL } from "../config.js";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const getHintForQuery = tool({
  description:
    "Look up a hint from the knowledge base for a keyword query. " +
    "Returns the hint text, or a 'no hint' message if nothing matched. " +
    "Rate-limited — avoid calling more than needed.",
  parameters: z.object({
    query: z
      .string()
      .describe("Keyword(s) to look up in the knowledge base"),
  }),
  execute: async ({ query }) => {
    const encoded = encodeURIComponent(query);

    const fetchHint = async (): Promise<{ query: string; hint: string | null }> => {
      const res = await fetch(`${BASE_URL}/api-wiedza/${encoded}`);

      if (res.status === 404) {
        return { query, hint: null };
      }

      if (res.status === 429) {
        await delay(1500);
        const retry = await fetch(`${BASE_URL}/api-wiedza/${encoded}`);
        if (!retry.ok) return { query, hint: null };
        const text = await retry.text();
        try {
          const json = JSON.parse(text);
          if (json.message?.includes("Nie udało się")) return { query, hint: null };
          return { query, hint: JSON.stringify(json) };
        } catch {
          return { query, hint: text || null };
        }
      }

      if (!res.ok) {
        return { query, hint: null };
      }

      const text = await res.text();
      try {
        const json = JSON.parse(text);
        if (json.message?.includes("Nie udało się")) return { query, hint: null };
        return { query, hint: JSON.stringify(json) };
      } catch {
        return { query, hint: text || null };
      }
    };

    return fetchHint();
  },
});
