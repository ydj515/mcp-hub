import type { ServerDefinition, ServerRegistry } from "@mcp-hub/core";

export const formatServerList = (servers: ServerDefinition[]) =>
  servers
    .map((server) => {
      const requiredEnv = server.requiredEnv?.length
        ? server.requiredEnv.join(", ")
        : "none";
      return `${server.id}\t${server.displayName}\t${server.version}\trequired env: ${requiredEnv}`;
    })
    .join("\n");

export const runListCommand = (registry: ServerRegistry) => {
  console.log(formatServerList(registry.list()));
};
