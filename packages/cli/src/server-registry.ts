import { createRegistry } from "@mcp-hub/core";
import { apiFinderServer } from "@mcp-hub/server-api-finder";
import { shortcutsServer } from "@mcp-hub/server-shortcuts";

export const serverRegistry = createRegistry([apiFinderServer, shortcutsServer]);
