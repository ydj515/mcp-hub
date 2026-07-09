import type { ServerDefinition } from "@mcp-hub/core";
import { loadPostgresConfig } from "./config.js";
import { createPostgresDatabase } from "./services/database.js";
import { registerPostgresTools } from "./tools/index.js";

export const postgresServer: ServerDefinition = {
  id: "postgres",
  displayName: "PostgreSQL MCP",
  version: "0.1.0",
  requiredEnv: ["POSTGRESQL_URL"],
  registerTools: (server, context) => {
    const config = loadPostgresConfig(context.env);
    const db = createPostgresDatabase(config);
    context.onClose(() => db.close());
    registerPostgresTools(server, db, config);
  }
};
