import { createRegistry } from "@mcp-hub/core";
import { shortcutsServer } from "@mcp-hub/server-shortcuts";

export const serverRegistry = createRegistry([shortcutsServer]);
