import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Logger } from "./logger.js";

export type ServerMode = "stdio" | "http";

export type ServerContext = {
  env: NodeJS.ProcessEnv;
  logger: Logger;
  mode: ServerMode;
  serverId: string;
};

export type ServerDefinition = {
  id: string;
  displayName: string;
  version: string;
  requiredEnv?: string[];
  registerTools: (
    server: McpServer,
    context: ServerContext
  ) => void | Promise<void>;
};
