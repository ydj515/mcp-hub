import { runStdioServer, type ServerRegistry } from "@mcp-hub/core";

export const runStdioCommand = async (
  registry: ServerRegistry,
  args: string[]
) => {
  const serverId = args[0];
  if (!serverId) {
    throw new Error("Usage: mcp-hub stdio <server-id>");
  }

  await runStdioServer(registry.get(serverId));
};
