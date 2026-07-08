import {
  createStreamableHttpApp,
  type ServerDefinition,
  type ServerRegistry
} from "@mcp-hub/core";
import http from "node:http";

export const selectServeDefinitions = (
  registry: ServerRegistry,
  args: string[]
): ServerDefinition[] => {
  const optionNamesWithValue = new Set(["--port", "--host", "--auth-token-env"]);
  const serverIds: string[] = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (optionNamesWithValue.has(arg)) {
      index += 1;
      continue;
    }
    if (arg.startsWith("--")) {
      continue;
    }
    serverIds.push(arg);
  }

  if (!serverIds.length) {
    throw new Error(
      "Usage: mcp-hub serve <server-id|all> [--port 3333] [--host 127.0.0.1]"
    );
  }

  if (serverIds[0] === "all") {
    return registry.list();
  }

  return serverIds.map((serverId) => registry.get(serverId));
};

const readOption = (args: string[], name: string, fallback: string) => {
  const index = args.indexOf(name);
  return index >= 0 ? (args[index + 1] ?? fallback) : fallback;
};

export const runServeCommand = async (
  registry: ServerRegistry,
  args: string[]
) => {
  const definitions = selectServeDefinitions(registry, args);
  const port = Number.parseInt(readOption(args, "--port", "3333"), 10);
  const host = readOption(args, "--host", "127.0.0.1");
  const authTokenEnv = readOption(args, "--auth-token-env", "");
  const bearerToken = authTokenEnv ? process.env[authTokenEnv] : undefined;

  const app = createStreamableHttpApp({
    definitions,
    exposeRootMcp: definitions.length === 1,
    bearerToken
  });

  const server = http.createServer(app);
  await new Promise<void>((resolve) => {
    server.listen(port, host, resolve);
  });

  console.error(`mcp-hub listening on http://${host}:${port}`);
};
