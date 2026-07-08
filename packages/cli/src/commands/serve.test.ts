import type { ServerDefinition } from "@mcp-hub/core";
import { createRegistry } from "@mcp-hub/core";
import { describe, expect, it } from "vitest";
import { selectServeDefinitions } from "./serve.js";

const fixtureServer = (id: string): ServerDefinition => ({
  id,
  displayName: `${id} server`,
  version: "0.1.0",
  registerTools: () => {}
});

describe("selectServeDefinitions", () => {
  it("ignores option values when selecting server ids", () => {
    const registry = createRegistry([fixtureServer("shortcuts")]);

    const definitions = selectServeDefinitions(registry, [
      "shortcuts",
      "--port",
      "3333",
      "--host",
      "127.0.0.1"
    ]);

    expect(definitions.map((definition) => definition.id)).toEqual([
      "shortcuts"
    ]);
  });
});
