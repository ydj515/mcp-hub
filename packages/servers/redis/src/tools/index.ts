import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { RedisConfig } from "../config.js";
import type { RedisReadService } from "../services/redis-client.js";
import { createRedisToolSchemas } from "./schemas.js";

const response = <T extends object>(value: T) => ({
  content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
  structuredContent: value
});

// Redis 자료형·운영 상태를 조회만 하므로 모든 tool이 read-only이고 특정 서버에 국한됩니다.
const readOnly = {
  readOnlyHint: true,
  openWorldHint: false
} as const;

const validateRange = (start: number, end: number, maxResults: number) => {
  if (Math.abs(end - start) + 1 > maxResults) {
    throw new Error("Requested range exceeds REDIS_MAX_RESULTS");
  }
};

export const registerRedisTools = (
  server: McpServer,
  redis: RedisReadService,
  config: RedisConfig
) => {
  const schemas = createRedisToolSchemas(config.maxResults);

  server.registerTool(
    "scan_keys",
    {
      title: "Scan Redis Keys",
      description: "Scan Redis keys without using KEYS or modifying data.",
      inputSchema: schemas.scanKeys.shape,
      annotations: readOnly
    },
    async ({ cursor, match, type, count }) =>
      response(await redis.scanKeys({
        cursor,
        match,
        type,
        count: count ?? config.scanCount
      }))
  );

  server.registerTool(
    "get_key_metadata",
    {
      title: "Get Redis Key Metadata",
      description: "Read a Redis key's type, TTL, memory usage, and length.",
      inputSchema: schemas.key.shape,
      annotations: readOnly
    },
    async ({ key }) => response(await redis.getKeyMetadata(key))
  );

  server.registerTool(
    "get_string",
    {
      title: "Get Redis String",
      description: "Read a Redis String value without modifying it.",
      inputSchema: schemas.key.shape,
      annotations: readOnly
    },
    async ({ key }) => response(await redis.getString(key))
  );

  server.registerTool(
    "get_hash",
    {
      title: "Get Redis Hash",
      description: "Scan fields and values from a Redis Hash.",
      inputSchema: schemas.collectionScan.shape,
      annotations: readOnly
    },
    async ({ key, cursor, match, count }) =>
      response(await redis.getHash({
        key,
        cursor,
        match,
        count: count ?? config.scanCount
      }))
  );

  server.registerTool(
    "get_list_range",
    {
      title: "Get Redis List Range",
      description: "Read a bounded range from a Redis List.",
      inputSchema: schemas.list.shape,
      annotations: readOnly
    },
    async ({ key, start, end }) => {
      validateRange(start, end, config.maxResults);
      return response(await redis.getListRange({ key, start, end }));
    }
  );

  server.registerTool(
    "get_set_members",
    {
      title: "Get Redis Set Members",
      description: "Scan members from a Redis Set.",
      inputSchema: schemas.collectionScan.shape,
      annotations: readOnly
    },
    async ({ key, cursor, match, count }) =>
      response(await redis.getSetMembers({
        key,
        cursor,
        match,
        count: count ?? config.scanCount
      }))
  );

  server.registerTool(
    "get_sorted_set_range",
    {
      title: "Get Redis Sorted Set Range",
      description: "Read members and scores from a bounded Redis Sorted Set range.",
      inputSchema: schemas.sortedSet.shape,
      annotations: readOnly
    },
    async ({ key, start, stop, reverse }) => {
      validateRange(start, stop, config.maxResults);
      return response(await redis.getSortedSetRange({
        key,
        start,
        stop,
        reverse: reverse ?? false
      }));
    }
  );

  server.registerTool(
    "get_stream_entries",
    {
      title: "Get Redis Stream Entries",
      description: "Read a bounded range of Redis Stream entries.",
      inputSchema: schemas.stream.shape,
      annotations: readOnly
    },
    async ({ key, start, end, count }) =>
      response(await redis.getStreamEntries({
        key,
        start: start ?? "-",
        end: end ?? "+",
        count: count ?? config.scanCount
      }))
  );

  server.registerTool(
    "get_server_info",
    {
      title: "Get Redis Server Info",
      description: "Read Redis INFO from every primary node.",
      inputSchema: schemas.serverInfo.shape,
      annotations: readOnly
    },
    async ({ section }) => response(await redis.getServerInfo(section))
  );

  server.registerTool(
    "get_database_size",
    {
      title: "Get Redis Database Size",
      description: "Read database key counts from every primary node.",
      inputSchema: {},
      annotations: readOnly
    },
    async () => response(await redis.getDatabaseSize())
  );

  server.registerTool(
    "get_client_list",
    {
      title: "Get Redis Client List",
      description: "Read connected Redis clients from every primary node.",
      inputSchema: schemas.clientList.shape,
      annotations: readOnly
    },
    async ({ type }) => response(await redis.getClientList(type))
  );

  server.registerTool(
    "get_slowlog",
    {
      title: "Get Redis Slowlog",
      description: "Read bounded Redis slowlog entries from every primary node.",
      inputSchema: schemas.slowlog.shape,
      annotations: readOnly
    },
    async ({ count }) => response(await redis.getSlowlog(count ?? config.slowlogCount))
  );

  server.registerTool(
    "get_topology_status",
    {
      title: "Get Redis Topology Status",
      description: "Read standalone, Cluster, or Sentinel topology status.",
      inputSchema: {},
      annotations: readOnly
    },
    async () => response(await redis.getTopologyStatus())
  );
};
