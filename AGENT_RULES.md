# Agent which resolves the task

Agent creates a plan to solve the task from instructions.
Agent uses tools on the way to resolve the task from the plan.

Each tool has its purpose:

- Task related tools
  - Get Questions and Token Tool
  - Get Hint for query Tool
  - Verify answers Tool
- Get Distinct Keywords for the sentence Tool
- File based memory tools
  - Read
  - Write
  - Delete

List of helpful hints for the agent to solve the task from instrictions.

- We have to fit in 15s timeframe from getting questions until sending verification
- Each get questions run gives differnt questions, sometimes they're repeating
- LLM Query sometimes may hit ratelimits
- Use AI Sdk, tools and OpenAI llm
