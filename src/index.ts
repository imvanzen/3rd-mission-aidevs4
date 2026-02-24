import "dotenv/config";
import { runAgent } from "./agent.js";

async function main() {
  console.log("Starting verification agent...\n");
  const result = await runAgent();
  console.log("\nAgent final response:", result);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
