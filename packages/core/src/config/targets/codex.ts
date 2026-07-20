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
  const env = Object.fromEntries(
    (request.server.requiredEnv ?? []).map((key) => [key, `<${key}>`])
  );
  const content = stringify({
    mcp_servers: {
      [name]: {
        command: command.command,
        args: command.args,
        ...(Object.keys(env).length ? { env } : {}),
        startup_timeout_sec: 20,
        tool_timeout_sec: 60
      }
    }
  });

  return { path, content };
};
