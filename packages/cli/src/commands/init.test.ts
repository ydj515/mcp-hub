import type { ServerDefinition } from "@mcp-hub/core";
import { createRegistry } from "@mcp-hub/core";
import { describe, expect, it, vi } from "vitest";
import { runInitCommand } from "./init.js";

const postgresServer: ServerDefinition = {
  id: "postgres",
  displayName: "PostgreSQL MCP",
  version: "0.1.0",
  registerTools: () => {}
};

describe("runInitCommand", () => {
  it("rejects unsupported init targets", () => {
    const registry = createRegistry([postgresServer]);

    expect(() =>
      runInitCommand(
        registry,
        ["--target", "typo", "--server", "postgres"],
        { log: vi.fn() }
      )
    ).toThrow("Unsupported init target: typo");
  });
});
