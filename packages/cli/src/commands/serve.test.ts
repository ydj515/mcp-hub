import type { ServerDefinition } from "@mcp-hub/core";
import { createRegistry } from "@mcp-hub/core";
import { describe, expect, it } from "vitest";
import {
  parsePort,
  readBearerToken,
  selectServeDefinitions
} from "./serve.js";

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

describe("parsePort", () => {
  it("accepts valid TCP ports", () => {
    expect(parsePort("3333")).toBe(3333);
  });

  it("rejects invalid TCP ports", () => {
    expect(() => parsePort("abc")).toThrow("Invalid port number: abc");
    expect(() => parsePort("0")).toThrow("Invalid port number: 0");
    expect(() => parsePort("65536")).toThrow("Invalid port number: 65536");
  });
});

describe("readBearerToken", () => {
  it("returns undefined when auth token env is not configured", () => {
    expect(readBearerToken("", {})).toBeUndefined();
  });

  it("fails closed when the configured auth token env is missing", () => {
    expect(() => readBearerToken("MCP_TOKEN", {})).toThrow(
      "Missing required auth token environment variable: MCP_TOKEN"
    );
  });

  it("returns the configured auth token", () => {
    expect(readBearerToken("MCP_TOKEN", { MCP_TOKEN: "secret" })).toBe(
      "secret"
    );
  });
});
