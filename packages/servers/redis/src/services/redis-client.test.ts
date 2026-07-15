import { describe, expect, it, vi } from "vitest";
import type {
  RedisClusterConfig,
  RedisSentinelConfig,
  RedisStandaloneConfig
} from "../config.js";
import {
  createNodeRedisConnection,
  createRedisReadService,
  decodeScanCursor,
  encodeScanCursor,
  normalizeValue,
  type RedisClientFactories,
  type RedisConnection,
  type RedisNode
} from "./redis-client.js";

const config: RedisStandaloneConfig = {
  mode: "standalone",
  url: "redis://localhost:6379",
  tls: false,
  maxResults: 100,
  maxValueBytes: 100,
  scanCount: 100,
  slowlogCount: 100,
  connectTimeoutMs: 10_000,
  commandTimeoutMs: 10_000
};

describe("normalizeValue", () => {
  it("preserves valid UTF-8", () => {
    expect(normalizeValue(Buffer.from("안녕하세요"), 100)).toEqual({
      value: "안녕하세요",
      encoding: "utf8",
      truncated: false
    });
  });

  it("returns invalid UTF-8 as Base64", () => {
    expect(normalizeValue(Buffer.from([0xff, 0x00]), 100)).toEqual({
      value: "/wA=",
      encoding: "base64",
      truncated: false
    });
  });

  it("truncates before encoding", () => {
    expect(normalizeValue(Buffer.from("abcdef"), 3)).toEqual({
      value: "abc",
      encoding: "utf8",
      truncated: true
    });
  });
});

describe("scan cursor", () => {
  it("round-trips a Cluster cursor", () => {
    const cursor = {
      version: 1 as const,
      nextNodeIndex: 1,
      nodeCursors: { "node-a": "0", "node-b": "17" }
    };

    expect(decodeScanCursor(encodeScanCursor(cursor))).toEqual(cursor);
  });

  it("rejects malformed cursor input", () => {
    expect(() => decodeScanCursor("not-a-cursor")).toThrow(
      "Invalid Redis scan cursor"
    );
  });
});

describe("createRedisReadService", () => {
  it("uses only GET to read a String value and closes the connection", async () => {
    const execute = vi.fn().mockResolvedValue(Buffer.from("value"));
    const close = vi.fn().mockResolvedValue(undefined);
    const connection: RedisConnection = {
      mode: "standalone",
      ready: Promise.resolve(),
      close,
      executeKey: execute,
      primaryNodes: async () => [{ id: "localhost:6379", execute }],
      sentinelNodes: async () => []
    };
    const service = createRedisReadService(config, () => connection);

    await expect(service.getString("session:1")).resolves.toEqual({
      exists: true,
      value: { value: "value", encoding: "utf8", truncated: false }
    });
    await service.close();

    expect(execute).toHaveBeenCalledExactlyOnceWith(["GET", "session:1"]);
    expect(close).toHaveBeenCalledOnce();
  });
});

const createRawClient = () => {
  const client = {
    on: vi.fn(),
    connect: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    sendCommand: vi.fn().mockResolvedValue(Buffer.from("value")),
    withTypeMapping: vi.fn()
  };
  client.withTypeMapping.mockReturnValue(client);
  return client;
};

const createConnection = (
  mode: RedisConnection["mode"],
  nodes: RedisNode[],
  executeKey = vi.fn(),
  sentinels: RedisNode[] = []
): RedisConnection => ({
  mode,
  ready: Promise.resolve(),
  close: vi.fn().mockResolvedValue(undefined),
  executeKey,
  primaryNodes: async () => nodes,
  sentinelNodes: async () => sentinels
});

describe("createNodeRedisConnection", () => {
  it("creates a standalone read connection with binary mapping", async () => {
    const client = createRawClient();
    const factories: RedisClientFactories = {
      createStandalone: vi.fn(() => client) as never,
      createCluster: vi.fn() as never,
      createSentinel: vi.fn() as never
    };

    const connection = createNodeRedisConnection(config, factories);
    await connection.ready;
    const [node] = await connection.primaryNodes();
    await node?.execute(["GET", "session:1"]);

    expect(factories.createStandalone).toHaveBeenCalledWith(
      expect.objectContaining({
        url: config.url,
        commandOptions: { timeout: config.commandTimeoutMs }
      })
    );
    expect(client.withTypeMapping).toHaveBeenCalledOnce();
    expect(client.on).toHaveBeenCalledWith("error", expect.any(Function));
    expect(client.sendCommand).toHaveBeenCalledWith(["GET", "session:1"]);
  });

  it("redacts Redis credentials from connection errors", async () => {
    const client = createRawClient();
    client.connect.mockRejectedValue(
      new Error("Connection to redis://readonly:secret@localhost:6379 failed: password=secret")
    );
    const factories: RedisClientFactories = {
      createStandalone: vi.fn(() => client) as never,
      createCluster: vi.fn() as never,
      createSentinel: vi.fn() as never
    };
    const connection = createNodeRedisConnection(
      { ...config, url: "redis://readonly:secret@localhost:6379", password: "secret" },
      factories
    );

    await expect(connection.ready).rejects.toThrow(
      "Connection to redis://[redacted]@localhost:6379 failed: password=[redacted]"
    );
  });

  it("does not expose standalone URL credentials through a node identifier", async () => {
    const client = createRawClient();
    const factories: RedisClientFactories = {
      createStandalone: vi.fn(() => client) as never,
      createCluster: vi.fn() as never,
      createSentinel: vi.fn() as never
    };
    const connection = createNodeRedisConnection(
      { ...config, url: "redis://readonly:secret@localhost:6379/0" },
      factories
    );

    await connection.ready;

    await expect(connection.primaryNodes()).resolves.toEqual([
      expect.objectContaining({ id: "redis://localhost:6379/0" })
    ]);
  });

  it("routes Cluster primary-node reads through node clients", async () => {
    const primary = createRawClient();
    const cluster = {
      ...createRawClient(),
      masters: [{ id: "node-a" }],
      nodeClient: vi.fn().mockResolvedValue(primary)
    };
    cluster.withTypeMapping.mockReturnValue(cluster);
    const clusterConfig: RedisClusterConfig = {
      ...config,
      mode: "cluster",
      nodes: ["redis://node-a:6379"]
    };
    const factories: RedisClientFactories = {
      createStandalone: vi.fn() as never,
      createCluster: vi.fn(() => cluster) as never,
      createSentinel: vi.fn() as never
    };

    const connection = createNodeRedisConnection(clusterConfig, factories);
    await connection.ready;
    const [node] = await connection.primaryNodes();
    await node?.execute(["DBSIZE"]);

    expect(factories.createCluster).toHaveBeenCalledWith(
      expect.objectContaining({
        rootNodes: [{ url: "redis://node-a:6379" }],
        commandOptions: { timeout: config.commandTimeoutMs }
      })
    );
    expect(cluster.nodeClient).toHaveBeenCalledWith(cluster.masters[0]);
    expect(primary.sendCommand).toHaveBeenCalledWith(["DBSIZE"]);
  });

  it("routes Cluster key reads through the Cluster client slot router", async () => {
    const cluster = {
      ...createRawClient(),
      masters: [],
      nodeClient: vi.fn()
    };
    cluster.withTypeMapping.mockReturnValue(cluster);
    const clusterConfig: RedisClusterConfig = {
      ...config,
      mode: "cluster",
      nodes: ["redis://node-a:6379"]
    };
    const factories: RedisClientFactories = {
      createStandalone: vi.fn() as never,
      createCluster: vi.fn(() => cluster) as never,
      createSentinel: vi.fn() as never
    };

    const connection = createNodeRedisConnection(clusterConfig, factories);
    await connection.ready;
    await connection.executeKey(["GET", "session:1"]);

    expect(cluster.sendCommand).toHaveBeenCalledWith(
      "session:1",
      true,
      ["GET", "session:1"]
    );
  });

  it("uses the actual key as the Cluster route for MEMORY USAGE", async () => {
    const cluster = {
      ...createRawClient(),
      masters: [],
      nodeClient: vi.fn()
    };
    cluster.withTypeMapping.mockReturnValue(cluster);
    const clusterConfig: RedisClusterConfig = {
      ...config,
      mode: "cluster",
      nodes: ["redis://node-a:6379"]
    };
    const factories: RedisClientFactories = {
      createStandalone: vi.fn() as never,
      createCluster: vi.fn(() => cluster) as never,
      createSentinel: vi.fn() as never
    };

    const connection = createNodeRedisConnection(clusterConfig, factories);
    await connection.ready;
    await connection.executeKey(["MEMORY", "USAGE", "session:1"], "session:1");

    expect(cluster.sendCommand).toHaveBeenCalledWith(
      "session:1",
      true,
      ["MEMORY", "USAGE", "session:1"]
    );
  });

  it("connects directly to configured Sentinel nodes for topology reads", async () => {
    const master = createRawClient();
    const sentinel = createRawClient();
    const sentinelConfig: RedisSentinelConfig = {
      ...config,
      mode: "sentinel",
      nodes: [{ host: "sentinel-a", port: 26379 }],
      masterName: "mymaster"
    };
    const factories: RedisClientFactories = {
      createStandalone: vi.fn(() => sentinel) as never,
      createCluster: vi.fn() as never,
      createSentinel: vi.fn(() => master) as never
    };

    const connection = createNodeRedisConnection(sentinelConfig, factories);
    await connection.ready;
    const [masterNode] = await connection.primaryNodes();
    const [node] = await connection.sentinelNodes();
    await masterNode?.execute(["GET", "session:1"]);
    await node?.execute(["SENTINEL", "MASTER", "mymaster"]);

    expect(factories.createSentinel).toHaveBeenCalledWith(
      expect.objectContaining({ name: "mymaster" })
    );
    expect(factories.createStandalone).toHaveBeenCalledWith(
      expect.objectContaining({ socket: expect.objectContaining({ host: "sentinel-a", port: 26379 }) })
    );
    expect(sentinel.sendCommand).toHaveBeenCalledWith([
      "SENTINEL",
      "MASTER",
      "mymaster"
    ]);
    expect(master.sendCommand).toHaveBeenCalledWith(true, ["GET", "session:1"]);
  });
});

describe("RedisReadService data and status readers", () => {
  it("returns an opaque next cursor after scanning one Cluster primary", async () => {
    const nodeA: RedisNode = {
      id: "node-a",
      execute: vi.fn().mockResolvedValue(["0", [Buffer.from("a"), Buffer.from("b")]])
    };
    const nodeB: RedisNode = {
      id: "node-b",
      execute: vi.fn().mockResolvedValue(["7", [Buffer.from("b")]])
    };
    const service = createRedisReadService(
      {
        ...config,
        mode: "cluster",
        nodes: ["redis://node-a:6379"],
        maxResults: 1
      },
      () => createConnection("cluster", [nodeA, nodeB])
    );

    const result = await service.scanKeys({ count: 1 });

    expect(result).toMatchObject({
      keys: [
        { value: "a", encoding: "utf8", truncated: false },
        { value: "b", encoding: "utf8", truncated: false }
      ],
      complete: false,
      truncated: false
    });
    expect(decodeScanCursor(result.cursor)).toEqual({
      version: 1,
      nextNodeIndex: 1,
      nodeCursors: { "node-a": "0", "node-b": "0" }
    });
    expect(nodeA.execute).toHaveBeenCalledWith(["SCAN", "0", "COUNT", "1"]);
    expect(nodeB.execute).not.toHaveBeenCalled();
  });

  it("reads collection data with dedicated read commands and applies result limits", async () => {
    const executeKey = vi.fn(async (args: string[]) => {
      switch (args[0]) {
        case "HSCAN":
          return ["0", [Buffer.from("name"), Buffer.from("codex"), Buffer.from("role"), Buffer.from("agent")]];
        case "LRANGE":
          return [Buffer.from("first"), Buffer.from("second")];
        case "SSCAN":
          return ["0", [Buffer.from("one"), Buffer.from("two")]];
        case "ZRANGE":
          return [Buffer.from("member-a"), "1.5", Buffer.from("member-b"), "2"];
        case "XRANGE":
          return [["1-0", [Buffer.from("event"), Buffer.from("created")]], ["2-0", [Buffer.from("event"), Buffer.from("updated")]]];
        default:
          throw new Error(`Unexpected command: ${args.join(" ")}`);
      }
    });
    const service = createRedisReadService(
      { ...config, maxResults: 1 },
      () => createConnection("standalone", [], executeKey)
    );

    await expect(service.getHash({ key: "user:1", count: 1 })).resolves.toEqual({
      cursor: "0",
      complete: true,
      entries: [
        { field: { value: "name", encoding: "utf8", truncated: false }, value: { value: "codex", encoding: "utf8", truncated: false } },
        { field: { value: "role", encoding: "utf8", truncated: false }, value: { value: "agent", encoding: "utf8", truncated: false } }
      ],
      truncated: false
    });
    await expect(service.getListRange({ key: "list:1", start: 0, end: 1 })).resolves.toMatchObject({
      values: [{ value: "first", encoding: "utf8", truncated: false }],
      truncated: true
    });
    await expect(service.getSetMembers({ key: "set:1", count: 1 })).resolves.toMatchObject({
      cursor: "0",
      complete: true,
      members: [
        { value: "one", encoding: "utf8", truncated: false },
        { value: "two", encoding: "utf8", truncated: false }
      ],
      truncated: false
    });
    await expect(service.getSortedSetRange({ key: "zset:1", start: 0, stop: 1, reverse: false })).resolves.toMatchObject({
      members: [{ value: { value: "member-a", encoding: "utf8", truncated: false }, score: "1.5" }],
      truncated: true
    });
    await expect(service.getStreamEntries({ key: "stream:1", start: "-", end: "+", count: 1 })).resolves.toMatchObject({
      entries: [{ id: "1-0", fields: { event: { value: "created", encoding: "utf8", truncated: false } } }],
      truncated: true
    });

    expect(executeKey).toHaveBeenCalledWith(["HSCAN", "user:1", "0", "COUNT", "1"]);
    expect(executeKey).toHaveBeenCalledWith(["LRANGE", "list:1", "0", "1"]);
    expect(executeKey).toHaveBeenCalledWith(["SSCAN", "set:1", "0", "COUNT", "1"]);
    expect(executeKey).toHaveBeenCalledWith(["ZRANGE", "zset:1", "0", "1", "WITHSCORES"]);
    expect(executeKey).toHaveBeenCalledWith(["XRANGE", "stream:1", "-", "+", "COUNT", "1"]);
  });

  it("returns key metadata using only metadata read commands", async () => {
    const executeKey = vi.fn(async (args: string[]) => {
      switch (args[0]) {
        case "EXISTS": return 1;
        case "TYPE": return "hash";
        case "TTL": return 60;
        case "MEMORY": return 2048;
        case "HLEN": return 3;
        default: throw new Error(`Unexpected command: ${args.join(" ")}`);
      }
    });
    const service = createRedisReadService(config, () =>
      createConnection("standalone", [], executeKey)
    );

    await expect(service.getKeyMetadata("user:1")).resolves.toEqual({
      exists: true,
      type: "hash",
      ttl_seconds: 60,
      memory_bytes: 2048,
      length: 3
    });
    expect(executeKey.mock.calls.map(([args]) => args[0])).toEqual([
      "EXISTS",
      "TYPE",
      "TTL",
      "MEMORY",
      "HLEN"
    ]);
  });

  it("aggregates Cluster primary diagnostics and caps global result lists", async () => {
    const nodeA: RedisNode = {
      id: "node-a",
      execute: vi.fn(async (args: string[]) => {
        switch (args[0]) {
          case "DBSIZE": return 2;
          case "CLIENT": return "id=1 addr=127.0.0.1:1";
          case "SLOWLOG": return [[1, 10, 20, ["GET", "key-a"], "127.0.0.1:1", "client-a"]];
          case "INFO": return "redis_version:8.0";
          case "ROLE": return ["master", 0, []];
          case "CLUSTER": return args[1] === "INFO" ? "cluster_state:ok" : "node-a connected";
          default: throw new Error(`Unexpected command: ${args.join(" ")}`);
        }
      })
    };
    const nodeB: RedisNode = {
      id: "node-b",
      execute: vi.fn(async (args: string[]) => {
        switch (args[0]) {
          case "DBSIZE": return 3;
          case "CLIENT": return "id=2 addr=127.0.0.1:2";
          case "SLOWLOG": return [[2, 11, 21, ["GET", "key-b"], "127.0.0.1:2", "client-b"]];
          case "INFO": return "redis_version:8.0";
          case "ROLE": return ["master", 0, []];
          case "CLUSTER": return args[1] === "INFO" ? "cluster_state:ok" : "node-b connected";
          default: throw new Error(`Unexpected command: ${args.join(" ")}`);
        }
      })
    };
    const service = createRedisReadService(
      { ...config, maxResults: 1 },
      () => createConnection("cluster", [nodeA, nodeB])
    );

    await expect(service.getDatabaseSize()).resolves.toEqual({
      total: 5,
      nodes: [{ id: "node-a", size: 2 }, { id: "node-b", size: 3 }]
    });
    await expect(service.getClientList()).resolves.toEqual({
      clients: [{ node_id: "node-a", id: "1", addr: "127.0.0.1:1" }],
      truncated: true
    });
    await expect(service.getSlowlog(2)).resolves.toMatchObject({
      entries: [{ node_id: "node-a", id: 1 }],
      truncated: true
    });
    await expect(service.getServerInfo("server")).resolves.toEqual({
      nodes: [
        { node_id: "node-a", info: "redis_version:8.0" },
        { node_id: "node-b", info: "redis_version:8.0" }
      ]
    });
    await expect(service.getTopologyStatus()).resolves.toMatchObject({
      mode: "cluster",
      roles: [
        { node_id: "node-a", role: ["master", 0, []] },
        { node_id: "node-b", role: ["master", 0, []] }
      ],
      cluster: [
        { node_id: "node-a", info: "cluster_state:ok", nodes: "node-a connected" },
        { node_id: "node-b", info: "cluster_state:ok", nodes: "node-b connected" }
      ]
    });
  });

  it("reads Sentinel topology from direct Sentinel connections", async () => {
    const master: RedisNode = {
      id: "mymaster",
      execute: vi.fn().mockResolvedValue(["master", 0, []])
    };
    const sentinel: RedisNode = {
      id: "sentinel-a:26379",
      execute: vi.fn(async (args: string[]) => {
        if (args[1] === "MASTER") return ["name", "mymaster", "flags", "master"];
        if (args[1] === "SENTINELS") return [["name", "sentinel-b"]];
        return [["name", "replica-a"]];
      })
    };
    const service = createRedisReadService(
      {
        ...config,
        mode: "sentinel",
        nodes: [{ host: "sentinel-a", port: 26379 }],
        masterName: "mymaster"
      },
      () => createConnection("sentinel", [master], vi.fn(), [sentinel])
    );

    await expect(service.getTopologyStatus()).resolves.toMatchObject({
      mode: "sentinel",
      roles: [{ node_id: "mymaster", role: ["master", 0, []] }],
      sentinel: [{
        node_id: "sentinel-a:26379",
        master: ["name", "mymaster", "flags", "master"],
        sentinels: [["name", "sentinel-b"]],
        replicas: [["name", "replica-a"]]
      }]
    });
  });
});
