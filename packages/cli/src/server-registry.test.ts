import { describe, expect, it } from "vitest";
import { serverRegistry } from "./server-registry.js";

describe("serverRegistry", () => {
  it("registers the Redis server", () => {
    expect(serverRegistry.has("redis")).toBe(true);
    expect(serverRegistry.get("redis")).toMatchObject({
      id: "redis",
      displayName: "Redis MCP"
    });
  });
});
