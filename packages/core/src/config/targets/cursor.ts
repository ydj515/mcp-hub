import {
  commandForServer,
  serverConfigName,
  type InitPreview,
  type InitRequest
} from "../init.js";

export const buildCursorConfig = (request: InitRequest): InitPreview => {
  const command = commandForServer(request);
  const path =
    request.scope === "project" ? ".cursor/mcp.json" : "~/.cursor/mcp.json";
  const env = Object.fromEntries(
    (request.server.requiredEnv ?? []).map((key) => [key, `\${${key}}`])
  );
  const content = JSON.stringify(
    {
      mcpServers: {
        [serverConfigName(request.server)]: {
          command: command.command,
          args: command.args,
          env
        }
      }
    },
    null,
    2
  );

  return { path, content };
};
