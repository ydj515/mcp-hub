import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { describe, expect, it, vi } from "vitest";
import type { RedisConfig } from "../config.js";
import type { RedisReadService } from "../services/redis-client.js";
import { registerRedisTools } from "./index.js";
import { createRedisToolSchemas } from "./schemas.js";

type ToolHandler = (input: Record<string, unknown>) => Promise<{
  structuredContent: unknown;
}>;

const config: RedisConfig = {
  mode: "standalone",
  url: "redis://localhost:6379",
  tls: false,
  maxResults: 100,
  maxValueBytes: 1_048_576,
  scanCount: 50,
  slowlogCount: 20,
  connectTimeoutMs: 10_000,
  commandTimeoutMs: 10_000
};

const createRedis = () => ({
  scanKeys: vi.fn().mockResolvedValue({ keys: [], cursor: "0", complete: true, truncated: false }),
  getKeyMetadata: vi.fn().mockResolvedValue({ exists: false, type: "none" }),
  getString: vi.fn().mockResolvedValue({
    exists: true,
    value: { value: "value", encoding: "utf8", truncated: false }
  }),
  getHash: vi.fn().mockResolvedValue({ entries: [], cursor: "0", complete: true, truncated: false }),
  getListRange: vi.fn().mockResolvedValue({ values: [], truncated: false }),
  getSetMembers: vi.fn().mockResolvedValue({ members: [], cursor: "0", complete: true, truncated: false }),
  getSortedSetRange: vi.fn().mockResolvedValue({ members: [], truncated: false }),
  getStreamEntries: vi.fn().mockResolvedValue({ entries: [], truncated: false }),
  getServerInfo: vi.fn().mockResolvedValue({ nodes: [] }),
  getDatabaseSize: vi.fn().mockResolvedValue({ total: 0, nodes: [] }),
  getClientList: vi.fn().mockResolvedValue({ clients: [], truncated: false }),
  getSlowlog: vi.fn().mockResolvedValue({ entries: [], truncated: false }),
  getTopologyStatus: vi.fn().mockResolvedValue({ mode: "standalone", roles: [] })
});

describe("createRedisToolSchemas", () => {
  it("validates scan counts and collection ranges at REDIS_MAX_RESULTS", () => {
    const schemas = createRedisToolSchemas(100);

    expect(() => schemas.scanKeys.parse({ count: 101 })).toThrow();
    expect(() => schemas.collectionScan.parse({ key: "set:1", count: 101 })).toThrow();
    expect(() => schemas.list.parse({ key: "list:1", start: 0, end: 100 })).toThrow();
    expect(() => schemas.sortedSet.parse({ key: "zset:1", start: 0, stop: 100 })).toThrow();
  });
});

describe("registerRedisTools", () => {
  it("registers the 13 dedicated read-only tools", () => {
    const handlers = new Map<string, ToolHandler>();
    const server = {
      registerTool: (
        name: string,
        _definition: unknown,
        handler: ToolHandler
      ) => handlers.set(name, handler)
    } as unknown as McpServer;

    registerRedisTools(server, createRedis() as unknown as RedisReadService, config);

    expect([...handlers.keys()]).toEqual([
      "scan_keys",
      "get_key_metadata",
      "get_string",
      "get_hash",
      "get_list_range",
      "get_set_members",
      "get_sorted_set_range",
      "get_stream_entries",
      "get_server_info",
      "get_database_size",
      "get_client_list",
      "get_slowlog",
      "get_topology_status"
    ]);
  });

  it("uses configured defaults and returns structured content", async () => {
    const handlers = new Map<string, ToolHandler>();
    const server = {
      registerTool: (
        name: string,
        _definition: unknown,
        handler: ToolHandler
      ) => handlers.set(name, handler)
    } as unknown as McpServer;
    const redis = createRedis();

    registerRedisTools(server, redis as unknown as RedisReadService, config);

    await expect(handlers.get("scan_keys")!({ match: "session:*" })).resolves.toMatchObject({
      structuredContent: { keys: [], cursor: "0", complete: true, truncated: false }
    });
    await expect(handlers.get("get_string")!({ key: "session:1" })).resolves.toMatchObject({
      structuredContent: {
        exists: true,
        value: { value: "value", encoding: "utf8", truncated: false }
      }
    });
    await expect(handlers.get("get_slowlog")!({})).resolves.toMatchObject({
      structuredContent: { entries: [], truncated: false }
    });

    expect(redis.scanKeys).toHaveBeenCalledWith({
      cursor: undefined,
      match: "session:*",
      type: undefined,
      count: 50
    });
    expect(redis.getString).toHaveBeenCalledWith("session:1");
    expect(redis.getSlowlog).toHaveBeenCalledWith(20);
  });

  it("rejects oversized List and Sorted Set ranges before calling Redis", async () => {
    const handlers = new Map<string, ToolHandler>();
    const server = {
      registerTool: (
        name: string,
        _definition: unknown,
        handler: ToolHandler
      ) => handlers.set(name, handler)
    } as unknown as McpServer;
    const redis = createRedis();

    registerRedisTools(server, redis as unknown as RedisReadService, config);

    await expect(
      handlers.get("get_list_range")!({ key: "list:1", start: 0, end: 100 })
    ).rejects.toThrow("Requested range exceeds REDIS_MAX_RESULTS");
    await expect(
      handlers.get("get_sorted_set_range")!({ key: "zset:1", start: 0, stop: 100 })
    ).rejects.toThrow("Requested range exceeds REDIS_MAX_RESULTS");

    expect(redis.getListRange).not.toHaveBeenCalled();
    expect(redis.getSortedSetRange).not.toHaveBeenCalled();
  });
});
