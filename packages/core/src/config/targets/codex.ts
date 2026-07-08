import { stringify } from "smol-toml";
import {
  commandForServer,
  serverConfigName,
  type InitPreview,
  type InitRequest
} from "../init.js";

export const buildCodexConfig = (request: InitRequest): InitPreview => {
  const command = commandForServer(request);
  const name = serverConfigName(request.server).replaceAll("-", "_");
  const path =
    request.scope === "project" ? ".codex/config.toml" : "~/.codex/config.toml";
  const content = stringify({
    mcp_servers: {
      [name]: {
        command: command.command,
        args: command.args,
        env_vars: request.server.requiredEnv ?? [],
        startup_timeout_sec: 20,
        tool_timeout_sec: 60
      }
    }
  });

  return { path, content };
};
