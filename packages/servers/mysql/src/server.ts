import type { ServerDefinition } from "@mcp-hub/core";
import { loadMySqlConfig } from "./config.js";
import { registerMySqlPrompts } from "./prompts.js";
import { createMySqlDatabase } from "./services/database.js";
import { registerMySqlTools } from "./tools/index.js";

export const mysqlServer: ServerDefinition = {
  id: "mysql",
  displayName: "MySQL MCP",
  version: "0.1.0",
  requiredEnv: ["MYSQL_URL"],
  registerTools: (server, context) => {
    const config = loadMySqlConfig(context.env);
    const db = createMySqlDatabase(config);
    context.onClose(() => db.close());
    registerMySqlTools(server, db, config);
    registerMySqlPrompts(server);
  }
};
