import { createRegistry } from "@mcp-hub/core";
import { apiFinderServer } from "@mcp-hub/server-api-finder";
import { gitlabServer } from "@mcp-hub/server-gitlab";
import { mysqlServer } from "@mcp-hub/server-mysql";
import { postgresServer } from "@mcp-hub/server-postgres";
import { redisServer } from "@mcp-hub/server-redis";
import { shortcutsServer } from "@mcp-hub/server-shortcuts";

export const serverRegistry = createRegistry([
  apiFinderServer,
  shortcutsServer,
  mysqlServer,
  postgresServer,
  gitlabServer,
  redisServer
]);
