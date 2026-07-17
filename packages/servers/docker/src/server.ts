import type { ServerDefinition } from "@mcp-hub/core";
import { loadDockerConfig } from "./config.js";
import { registerDockerPrompts } from "./prompts.js";
import { createDockerService } from "./services/docker-client.js";
import { registerDockerTools } from "./tools/index.js";

export const dockerServer: ServerDefinition = {
  id: "docker",
  displayName: "Docker MCP",
  version: "0.1.0",
  registerTools: (server, context) => {
    const config = loadDockerConfig(context.env);
    registerDockerTools(server, createDockerService(config), config);
    registerDockerPrompts(server);
  }
};
