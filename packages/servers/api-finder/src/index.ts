import type { ServerDefinition } from "@mcp-hub/core";
import { registerApiFinderTools } from "./tools.js";

export const apiFinderServer: ServerDefinition = {
  id: "api-finder",
  displayName: "Public Data API Finder MCP",
  version: "0.1.0",
  requiredEnv: ["PUBLIC_DATA_API_KEY"],
  registerTools: (server, context) => {
    registerApiFinderTools(server, context.env);
  }
};
