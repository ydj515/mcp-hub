import type { ServerDefinition } from "@mcp-hub/core";
import { registerShortcutTools } from "./tools/index.js";

export const shortcutsServer: ServerDefinition = {
  id: "shortcuts",
  displayName: "Keyboard Shortcuts MCP",
  version: "0.1.0",
  registerTools: (server) => {
    registerShortcutTools(server);
  }
};
