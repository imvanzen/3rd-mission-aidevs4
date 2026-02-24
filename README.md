# Weryfikacja AI Devs

Verification agent for [AI Devs](https://aidevs.pl): answers 4 Polish knowledge questions about a fictional sci-fi world within a 15-second window.

## Requirements

- **Node.js** (v18+)
- **OpenAI API key** (set as `OPENAI_API_KEY` in environment)

## Setup

```bash
npm install
```

Create a `.env` file in the project root:

```env
OPENAI_API_KEY=your_openai_api_key
```

## Run

```bash
npm run
```

Or:

```bash
npm run verify
```

Both use `tsx` to execute `src/index.ts`.

## How it works

- The agent fetches 4 questions and a verification token from the story API (`https://story.aidevs.pl`).
- A **15-second clock** starts when questions are received. Answers must be verified before time runs out.
- The API is **rate-limited**: at most 4 requests per 10 seconds across all endpoints.
- The agent uses:
  - **Task tools**: get questions + token, get hint for a query, verify answers.
  - **Memory tools**: read/write/delete a file-based cache of correct question→answer pairs to improve over runs.
  - **Keywords tool**: get distinct keywords for a sentence (support).
- Strategy: use cached answers when possible, request at most 2 hints for uncached questions (single Polish keyword each), then verify all 4 answers in one call and persist new correct answers to the cache.

## Project structure

```
src/
  index.ts      # Entry point, runs the agent
  agent.ts      # Agent loop (AI SDK generateText + tools)
  config.ts     # BASE_URL, CACHE_FILE, MODEL_NAME
  tools/
    verification.ts  # getQuestionsAndToken, verifyAnswers
    knowledge.ts     # getHintForQuery
    keywords.ts      # getKeywords
    memory.ts        # readMemory, writeMemory, deleteMemory
```

## Scripts

| Script   | Command        | Description                    |
|----------|----------------|--------------------------------|
| `run`    | `tsx src/index.ts` | Run the verification agent |
| `verify` | `tsx src/index.ts` | Same as `run`              |
| `build`  | `tsc`          | Compile TypeScript             |
| `start`  | `node dist/index.js` | Run compiled output        |

## Tech stack

- **TypeScript** + **tsx**
- **Vercel AI SDK** (`ai`, `@ai-sdk/openai`)
- **OpenAI** (`gpt-4o-mini` by default)
- **dotenv**, **zod**
