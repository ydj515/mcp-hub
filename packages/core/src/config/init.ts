import type { ServerDefinition } from "../server-definition.js";
import { buildAntigravityConfig } from "./targets/antigravity.js";
import { buildClaudeConfig } from "./targets/claude.js";
import { buildCodexConfig } from "./targets/codex.js";
import { buildCursorConfig } from "./targets/cursor.js";

export type InitTarget =
  | "claude-desktop"
  | "codex"
  | "cursor"
  | "antigravity";
export type InitScope = "project" | "user";
export type CommandMode = "npx" | "local";

export type InitRequest = {
  target: InitTarget;
  scope: InitScope;
  server: ServerDefinition;
  commandMode: CommandMode;
  packageName: string;
  localCliPath?: string;
};

export type InitPreview = {
  path: string;
  content: string;
};

const initTargets = new Set<string>([
  "antigravity",
  "claude-desktop",
  "codex",
  "cursor"
]);

export const isInitTarget = (target: string | undefined): target is InitTarget =>
  typeof target === "string" && initTargets.has(target);

export const serverConfigName = (server: ServerDefinition) =>
  `mcp-hub-${server.id}`;

export const commandForServer = (request: InitRequest) => {
  if (request.commandMode === "local") {
    if (!request.localCliPath) {
      throw new Error("local mode requires localCliPath");
    }
    return {
      command: "node",
      args: [request.localCliPath, "stdio", request.server.id]
    };
  }

  return {
    command: "npx",
    args: ["-y", request.packageName, "stdio", request.server.id]
  };
};

export const buildInitPreview = (request: InitRequest): InitPreview => {
  if (request.target === "codex") {
    return buildCodexConfig(request);
  }
  if (request.target === "cursor") {
    return buildCursorConfig(request);
  }
  if (request.target === "claude-desktop") {
    return buildClaudeConfig(request);
  }
  if (request.target === "antigravity") {
    return buildAntigravityConfig(request);
  }
  throw new Error(`Unsupported init target: ${String(request.target)}`);
};
