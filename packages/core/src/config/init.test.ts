import { describe, expect, it } from "vitest";
import type { ServerDefinition } from "../server-definition.js";
import { buildInitPreview } from "./init.js";

const postgresServer: ServerDefinition = {
  id: "postgres",
  displayName: "PostgreSQL MCP",
  version: "0.1.0",
  requiredEnv: ["POSTGRES_URL"],
  registerTools: () => {}
};

describe("buildInitPreview", () => {
  it("builds Codex project TOML preview", () => {
    const result = buildInitPreview({
      target: "codex",
      scope: "project",
      server: postgresServer,
      commandMode: "npx",
      packageName: "mcp-hub"
    });

    expect(result.path).toBe(".codex/config.toml");
    expect(result.content).toContain("[mcp_servers.mcp_hub_postgres]");
    expect(result.content).toContain('command = "npx"');
    expect(result.content).toContain('"stdio"');
    expect(result.content).toContain('"postgres"');
    expect(result.content).toContain("[mcp_servers.mcp_hub_postgres.env]");
    expect(result.content).toContain('POSTGRES_URL = "<POSTGRES_URL>"');
  });

  it("builds Cursor project JSON preview", () => {
    const result = buildInitPreview({
      target: "cursor",
      scope: "project",
      server: postgresServer,
      commandMode: "npx",
      packageName: "mcp-hub"
    });

    expect(result.path).toBe(".cursor/mcp.json");
    expect(
      JSON.parse(result.content).mcpServers["mcp-hub-postgres"].args
    ).toEqual(["-y", "mcp-hub", "stdio", "postgres"]);
  });

  it("rejects unsupported targets at runtime", () => {
    expect(() =>
      buildInitPreview({
        target: "typo" as never,
        scope: "project",
        server: postgresServer,
        commandMode: "npx",
        packageName: "mcp-hub"
      })
    ).toThrow("Unsupported init target: typo");
  });
});
