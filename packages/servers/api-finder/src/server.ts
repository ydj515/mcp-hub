import type { ServerDefinition } from "@mcp-hub/core";
import { registerApiFinderPrompts } from "./prompts.js";
import { registerApiFinderTools } from "./tools/index.js";

export const apiFinderServer: ServerDefinition = {
  id: "api-finder",
  displayName: "Public Data API Finder MCP",
  version: "0.1.0",
  requiredEnv: ["PUBLIC_DATA_API_KEY"],
  registerTools: (server, context) => {
    registerApiFinderTools(server, context.env);
    registerApiFinderPrompts(server);
  }
};
