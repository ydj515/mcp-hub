import {
  commandForServer,
  serverConfigName,
  type InitPreview,
  type InitRequest
} from "../init.js";

export const buildAntigravityConfig = (request: InitRequest): InitPreview => {
  const command = commandForServer(request);
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

  return {
    path:
      request.scope === "project"
        ? ".agents/settings.json"
        : "~/.gemini/config/mcp_config.json",
    content
  };
};
