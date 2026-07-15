import { describe, expect, it } from "vitest";
import { serverRegistry } from "./server-registry.js";

describe("serverRegistry", () => {
  it("registers the Redis and Docker servers", () => {
    expect(serverRegistry.has("redis")).toBe(true);
    expect(serverRegistry.get("redis")).toMatchObject({
      id: "redis",
      displayName: "Redis MCP"
    });
    expect(serverRegistry.has("docker")).toBe(true);
    expect(serverRegistry.get("docker")).toMatchObject({
      id: "docker",
      displayName: "Docker MCP"
    });
  });
});
