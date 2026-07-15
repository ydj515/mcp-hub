import { describe, expect, it } from "vitest";
import { loadRedisConfig } from "./config.js";

describe("loadRedisConfig", () => {
  it("loads safe standalone defaults", () => {
    expect(
      loadRedisConfig({
        REDIS_URL: "redis://readonly:pw@localhost:6379/0"
      })
    ).toEqual({
      mode: "standalone",
      url: "redis://readonly:pw@localhost:6379/0",
      username: undefined,
      password: undefined,
      tls: false,
      maxResults: 100,
      maxValueBytes: 1_048_576,
      scanCount: 100,
      slowlogCount: 100,
      connectTimeoutMs: 10_000,
      commandTimeoutMs: 10_000
    });
  });

  it("loads Cluster startup nodes", () => {
    expect(
      loadRedisConfig({
        REDIS_MODE: "cluster",
        REDIS_CLUSTER_NODES: "rediss://node-a:6379, rediss://node-b:6379",
        REDIS_TLS: "true"
      })
    ).toMatchObject({
      mode: "cluster",
      nodes: ["rediss://node-a:6379", "rediss://node-b:6379"],
      tls: true
    });
  });

  it("loads Sentinel nodes and master name", () => {
    expect(
      loadRedisConfig({
        REDIS_MODE: "sentinel",
        REDIS_SENTINEL_NODES: "sentinel-a:26379,sentinel-b:26380",
        REDIS_SENTINEL_MASTER_NAME: "mymaster"
      })
    ).toMatchObject({
      mode: "sentinel",
      nodes: [
        { host: "sentinel-a", port: 26379 },
        { host: "sentinel-b", port: 26380 }
      ],
      masterName: "mymaster"
    });
  });

  it("requires a Sentinel master name", () => {
    expect(() =>
      loadRedisConfig({
        REDIS_MODE: "sentinel",
        REDIS_SENTINEL_NODES: "sentinel-a:26379"
      })
    ).toThrow("REDIS_SENTINEL_MASTER_NAME is required when REDIS_MODE=sentinel");
  });

  it("rejects zero and malformed limits", () => {
    expect(() =>
      loadRedisConfig({
        REDIS_URL: "redis://localhost:6379",
        REDIS_MAX_RESULTS: "0"
      })
    ).toThrow("REDIS_MAX_RESULTS must be a positive integer");
    expect(() =>
      loadRedisConfig({
        REDIS_URL: "redis://localhost:6379",
        REDIS_TLS: "yes"
      })
    ).toThrow("REDIS_TLS must be true or false");
  });
});
