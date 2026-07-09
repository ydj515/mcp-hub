import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createStderrLogger } from "./logger.js";
import type {
  ServerCleanup,
  ServerDefinition,
  ServerMode
} from "./server-definition.js";

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
  const cleanupCallbacks: ServerCleanup[] = [];
  let closed = false;

  const server = new McpServer({
    name: definition.id,
    version: definition.version
  });

  const runCleanup = async () => {
    if (closed) {
      return;
    }
    closed = true;
    for (const cleanup of cleanupCallbacks.splice(0).reverse()) {
      await cleanup();
    }
  };

  const originalClose = server.close.bind(server);
  server.close = async () => {
    try {
      await originalClose();
    } finally {
      await runCleanup();
    }
  };

  try {
    await definition.registerTools(server, {
      env,
      logger: createStderrLogger(definition.id),
      mode: options.mode,
      onClose: (cleanup) => {
        cleanupCallbacks.push(cleanup);
      },
      serverId: definition.id
    });
  } catch (error) {
    await runCleanup();
    throw error;
  }

  return server;
};
