import {
  commandForServer,
  serverConfigName,
  type InitPreview,
  type InitRequest
} from "../init.js";

export const buildClaudeConfig = (request: InitRequest): InitPreview => {
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
    path: "claude_desktop_config.json",
    content
  };
};
