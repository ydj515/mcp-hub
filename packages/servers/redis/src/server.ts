import type { ServerDefinition } from "@mcp-hub/core";
import { loadRedisConfig } from "./config.js";
import { registerRedisPrompts } from "./prompts.js";
import {
  createNodeRedisConnection,
  createRedisReadService
} from "./services/redis-client.js";
import { registerRedisTools } from "./tools/index.js";

export const redisServer: ServerDefinition = {
  id: "redis",
  displayName: "Redis MCP",
  version: "0.1.0",
  registerTools: async (server, context) => {
    const config = loadRedisConfig(context.env);
    const redis = createRedisReadService(config, createNodeRedisConnection);
    context.onClose(() => redis.close());
    await redis.ready;
    registerRedisTools(server, redis, config);
    registerRedisPrompts(server);
  }
};
