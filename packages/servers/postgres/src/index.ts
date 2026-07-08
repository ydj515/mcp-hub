import type { ServerDefinition } from "@mcp-hub/core";
import { loadPostgresConfig } from "./config.js";
import { createPostgresDatabase } from "./db.js";
import { registerPostgresTools } from "./tools.js";

export const postgresServer: ServerDefinition = {
  id: "postgres",
  displayName: "PostgreSQL MCP",
  version: "0.1.0",
  requiredEnv: ["DATABASE_URL"],
  registerTools: (server, context) => {
    const config = loadPostgresConfig(context.env);
    const db = createPostgresDatabase(config);
    registerPostgresTools(server, db, config);
  }
};
