import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createStderrLogger } from "./logger.js";
import type { ServerDefinition, ServerMode } from "./server-definition.js";

export type CreateMcpServerOptions = {
  env?: NodeJS.ProcessEnv;
  mode: ServerMode;
};

export const validateRequiredEnv = (
  definition: ServerDefinition,
  env: NodeJS.ProcessEnv
) => {
  const missing = (definition.requiredEnv ?? []).filter((key) => !env[key]);
  if (missing.length) {
    throw new Error(
      `${definition.id} is missing required environment variables: ${missing.join(", ")}`
    );
  }
};

export const createMcpServerFromDefinition = async (
  definition: ServerDefinition,
  options: CreateMcpServerOptions
) => {
  const env = options.env ?? process.env;
  validateRequiredEnv(definition, env);

  const server = new McpServer({
    name: definition.id,
    version: definition.version
  });

  await definition.registerTools(server, {
    env,
    logger: createStderrLogger(definition.id),
    mode: options.mode,
    serverId: definition.id
  });

  return server;
};
