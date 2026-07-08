#!/usr/bin/env node
import { runListCommand } from "./commands/list.js";
import { runServeCommand } from "./commands/serve.js";
import { runStdioCommand } from "./commands/stdio.js";
import { serverRegistry } from "./server-registry.js";

const [, , command, ...args] = process.argv;

const main = async () => {
  if (!command || command === "help" || command === "--help" || command === "-h") {
    console.error("Usage: mcp-hub <list|stdio|serve> [args]");
    return;
  }

  if (command === "list") {
    runListCommand(serverRegistry);
    return;
  }

  if (command === "stdio") {
    await runStdioCommand(serverRegistry, args);
    return;
  }

  if (command === "serve") {
    await runServeCommand(serverRegistry, args);
    return;
  }

  throw new Error(`Unknown command: ${command}`);
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
