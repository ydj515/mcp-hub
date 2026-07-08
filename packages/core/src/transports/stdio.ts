import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createMcpServerFromDefinition } from "../create-server.js";
import type { ServerDefinition } from "../server-definition.js";

export const runStdioServer = async (
  definition: ServerDefinition,
  env: NodeJS.ProcessEnv = process.env
) => {
  const server = await createMcpServerFromDefinition(definition, {
    env,
    mode: "stdio"
  });
  const transport = new StdioServerTransport();
  await server.connect(transport);
};
