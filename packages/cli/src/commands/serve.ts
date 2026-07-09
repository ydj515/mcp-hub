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
  if (index < 0) {
    return fallback;
  }
  const value = args[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`${name} requires a value`);
  }
  return value;
};

export const parsePort = (value: string) => {
  if (!/^\d+$/.test(value)) {
    throw new Error(`Invalid port number: ${value}`);
  }
  const port = Number.parseInt(value, 10);
  if (port <= 0 || port > 65535) {
    throw new Error(`Invalid port number: ${value}`);
  }
  return port;
};

export const readBearerToken = (
  authTokenEnv: string,
  env: NodeJS.ProcessEnv = process.env
) => {
  if (!authTokenEnv) {
    return undefined;
  }
  const token = env[authTokenEnv];
  if (!token) {
    throw new Error(
      `Missing required auth token environment variable: ${authTokenEnv}`
    );
  }
  return token;
};

export const runServeCommand = async (
  registry: ServerRegistry,
  args: string[]
) => {
  const definitions = selectServeDefinitions(registry, args);
  const port = parsePort(readOption(args, "--port", "3333"));
  const host = readOption(args, "--host", "127.0.0.1");
  const authTokenEnv = readOption(args, "--auth-token-env", "");
  const bearerToken = readBearerToken(authTokenEnv);

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
