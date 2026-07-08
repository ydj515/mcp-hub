import { createRegistry } from "@mcp-hub/core";
import { apiFinderServer } from "@mcp-hub/server-api-finder";
import { postgresServer } from "@mcp-hub/server-postgres";
import { shortcutsServer } from "@mcp-hub/server-shortcuts";

export const serverRegistry = createRegistry([
  apiFinderServer,
  shortcutsServer,
  postgresServer
]);
