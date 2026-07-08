import { describe, expect, it } from "vitest";
import { createRegistry } from "./registry.js";
import type { ServerDefinition } from "./server-definition.js";

const fixtureServer = (id: string): ServerDefinition => ({
  id,
  displayName: `${id} server`,
  version: "1.0.0",
  registerTools: () => {}
});

describe("createRegistry", () => {
  it("returns registered servers in insertion order", () => {
    const registry = createRegistry([
      fixtureServer("shortcuts"),
      fixtureServer("postgres")
    ]);

    expect(registry.list().map((server) => server.id)).toEqual([
      "shortcuts",
      "postgres"
    ]);
  });

  it("throws for duplicate server ids", () => {
    expect(() =>
      createRegistry([fixtureServer("postgres"), fixtureServer("postgres")])
    ).toThrow('Duplicate MCP server id: "postgres"');
  });

  it("throws for unknown server lookup", () => {
    const registry = createRegistry([fixtureServer("shortcuts")]);
    expect(() => registry.get("missing")).toThrow(
      'Unknown MCP server: "missing"'
    );
  });
});
