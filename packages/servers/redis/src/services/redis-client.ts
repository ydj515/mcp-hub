import { isUtf8 } from "node:buffer";
import {
  createClient,
  createCluster,
  createSentinel,
  RESP_TYPES
} from "redis";
import type { RedisConfig } from "../config.js";

export type RedisValue = {
  value: string;
  encoding: "utf8" | "base64";
  truncated: boolean;
};

export type RedisNode = {
  id: string;
  execute: (args: string[]) => Promise<unknown>;
};

export type RedisConnection = {
  mode: RedisConfig["mode"];
  ready: Promise<void>;
  close: () => Promise<void>;
  executeKey: (args: string[], routingKey?: string) => Promise<unknown>;
  primaryNodes: () => Promise<RedisNode[]>;
  sentinelNodes: () => Promise<RedisNode[]>;
};

export type RedisConnectionFactory = (
  config: RedisConfig
) => RedisConnection;

type RedisRawClient = {
  on: (event: "error", listener: (error: Error) => void) => unknown;
  connect: () => Promise<unknown>;
  close: () => Promise<void>;
  sendCommand: (...args: unknown[]) => Promise<unknown>;
  withTypeMapping: (mapping: Record<number, typeof Buffer>) => RedisRawClient;
};

type RedisRawCluster = RedisRawClient & {
  masters: Array<{ id: string }>;
  nodeClient: (node: { id: string }) => Promise<RedisRawClient>;
};

type RedisRawSentinel = Omit<RedisRawClient, "sendCommand"> & {
  sendCommand: (isReadonly: boolean, args: string[]) => Promise<unknown>;
};

export type RedisClientFactories = {
  createStandalone: (options: Record<string, unknown>) => RedisRawClient;
  createCluster: (options: Record<string, unknown>) => RedisRawCluster;
  createSentinel: (options: Record<string, unknown>) => RedisRawClient;
};

export type RedisReadService = {
  ready: Promise<void>;
  close: () => Promise<void>;
  scanKeys: (input: ScanInput) => Promise<ScanResult>;
  getKeyMetadata: (key: string) => Promise<KeyMetadata>;
  getString: (key: string) => Promise<{
    exists: boolean;
    value: RedisValue | null;
  }>;
  getHash: (input: HashInput) => Promise<HashResult>;
  getListRange: (input: ListInput) => Promise<ListResult>;
  getSetMembers: (input: SetInput) => Promise<SetResult>;
  getSortedSetRange: (input: SortedSetInput) => Promise<SortedSetResult>;
  getStreamEntries: (input: StreamInput) => Promise<StreamResult>;
  getServerInfo: (section?: string) => Promise<ServerInfoResult>;
  getDatabaseSize: () => Promise<DatabaseSizeResult>;
  getClientList: (type?: string) => Promise<ClientListResult>;
  getSlowlog: (count: number) => Promise<SlowlogResult>;
  getTopologyStatus: () => Promise<TopologyResult>;
};

export type ScanInput = {
  cursor?: string;
  match?: string;
  type?: string;
  count: number;
};

export type ScanResult = {
  keys: RedisValue[];
  cursor: string;
  complete: boolean;
  truncated: boolean;
};

export type HashInput = {
  key: string;
  cursor?: string;
  match?: string;
  count: number;
};

export type HashResult = {
  cursor: string;
  complete: boolean;
  entries: Array<{ field: RedisValue; value: RedisValue }>;
  truncated: boolean;
};

export type ListInput = {
  key: string;
  start: number;
  end: number;
};

export type ListResult = {
  values: RedisValue[];
  truncated: boolean;
};

export type SetInput = {
  key: string;
  cursor?: string;
  match?: string;
  count: number;
};

export type SetResult = {
  cursor: string;
  complete: boolean;
  members: RedisValue[];
  truncated: boolean;
};

export type SortedSetInput = {
  key: string;
  start: number;
  stop: number;
  reverse: boolean;
};

export type SortedSetResult = {
  members: Array<{ value: RedisValue; score: string }>;
  truncated: boolean;
};

export type StreamInput = {
  key: string;
  start: string;
  end: string;
  count: number;
};

export type StreamResult = {
  entries: Array<{ id: string; fields: Record<string, RedisValue> }>;
  truncated: boolean;
};

export type KeyMetadata = {
  exists: boolean;
  type: string;
  ttl_seconds: number | null;
  memory_bytes: number | null;
  length: number | null;
};

export type ServerInfoResult = {
  nodes: Array<{ node_id: string; info: string }>;
};

export type DatabaseSizeResult = {
  total: number;
  nodes: Array<{ id: string; size: number }>;
};

export type ClientListResult = {
  clients: Array<Record<string, string>>;
  truncated: boolean;
};

export type SlowlogResult = {
  entries: Array<Record<string, unknown>>;
  truncated: boolean;
};

export type TopologyResult = {
  mode: RedisConfig["mode"];
  roles: Array<{ node_id: string; role: unknown }>;
  cluster?: Array<{ node_id: string; info: string; nodes: string }>;
  sentinel?: Array<{
    node_id: string;
    master: unknown;
    sentinels: unknown;
    replicas: unknown;
  }>;
};

type ScanCursor = {
  version: 1;
  nextNodeIndex: number;
  nodeCursors: Record<string, string>;
};

const asArray = (value: unknown, description: string): unknown[] => {
  if (!Array.isArray(value)) {
    throw new Error(`Unexpected Redis ${description} response`);
  }
  return value;
};

const toBuffer = (value: unknown) => {
  if (Buffer.isBuffer(value)) {
    return value;
  }
  if (typeof value === "string") {
    return Buffer.from(value);
  }
  throw new Error("Unexpected Redis value type");
};

const toText = (value: unknown) => {
  if (Buffer.isBuffer(value)) {
    return value.toString("utf8");
  }
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  throw new Error("Unexpected Redis text value");
};

const toInteger = (value: unknown, description: string) => {
  const parsed = typeof value === "number" ? value : Number(toText(value));
  if (!Number.isInteger(parsed)) {
    throw new Error(`Unexpected Redis ${description} value`);
  }
  return parsed;
};

export const normalizeValue = (
  source: Buffer,
  maxValueBytes: number
): RedisValue => {
  const bytes = source.subarray(0, maxValueBytes);
  const truncated = source.byteLength > maxValueBytes;

  if (isUtf8(bytes)) {
    return { value: bytes.toString("utf8"), encoding: "utf8", truncated };
  }

  return { value: bytes.toString("base64"), encoding: "base64", truncated };
};

export const encodeScanCursor = (cursor: ScanCursor) =>
  Buffer.from(JSON.stringify(cursor)).toString("base64url");

export const decodeScanCursor = (value: string): ScanCursor => {
  try {
    const parsed = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8")
    ) as Partial<ScanCursor>;
    if (
      parsed.version !== 1 ||
      !Number.isInteger(parsed.nextNodeIndex) ||
      !parsed.nodeCursors ||
      typeof parsed.nodeCursors !== "object"
    ) {
      throw new Error("Invalid cursor");
    }
    if (!Object.values(parsed.nodeCursors).every((cursor) => typeof cursor === "string")) {
      throw new Error("Invalid cursor");
    }
    return parsed as ScanCursor;
  } catch {
    throw new Error("Invalid Redis scan cursor");
  }
};

const limitResults = <T>(values: T[], maxResults: number) => ({
  values: values.slice(0, maxResults),
  truncated: values.length > maxResults
});

const hasTruncatedValue = (values: RedisValue[]) =>
  values.some((value) => value.truncated);

const normalizeValues = (values: unknown[], maxValueBytes: number) =>
  values.map((value) => normalizeValue(toBuffer(value), maxValueBytes));

const parseScanResponse = (result: unknown) => {
  const response = asArray(result, "scan");
  const cursor = response[0];
  const values = response[1];
  if (cursor === undefined || values === undefined) {
    throw new Error("Unexpected Redis scan response");
  }
  return {
    cursor: toText(cursor),
    values: asArray(values, "scan values")
  };
};

const scanArguments = (
  command: "SCAN" | "HSCAN" | "SSCAN",
  keyOrCursor: string,
  cursorOrCount: string,
  countOrMatch: number | string | undefined,
  match?: string
) => {
  const args = command === "SCAN"
    ? [command, keyOrCursor]
    : [command, keyOrCursor, cursorOrCount];
  const count = command === "SCAN" ? cursorOrCount : countOrMatch;
  const pattern = command === "SCAN" ? countOrMatch : match;
  if (typeof pattern === "string") {
    args.push("MATCH", pattern);
  }
  args.push("COUNT", String(count));
  return args;
};

const parseClientLine = (line: string) => {
  const client: Record<string, string> = {};
  for (const field of line.split(" ")) {
    const separator = field.indexOf("=");
    if (separator > 0) {
      client[field.slice(0, separator)] = field.slice(separator + 1);
    }
  }
  return client;
};

const normalizeDiagnostic = (value: unknown): unknown => {
  if (Buffer.isBuffer(value)) {
    return toText(value);
  }
  if (Array.isArray(value)) {
    return value.map(normalizeDiagnostic);
  }
  return value;
};

const redactConnectionError = (error: unknown, config: RedisConfig) => {
  const source = error instanceof Error ? error.message : String(error);
  let message = source.replace(
    new RegExp("(rediss?://)[^@\\s/]+@", "gi"),
    "$1[redacted]@"
  );
  message = message.replace(
    new RegExp("(password|REDIS_PASSWORD)=([^\\s,]+)", "gi"),
    "$1=[redacted]"
  );
  if (config.password) {
    message = message.replaceAll(config.password, "[redacted]");
  }
  return new Error(message);
};

const connectReady = (connect: () => Promise<unknown>, config: RedisConfig) =>
  connect().then(
    () => undefined,
    (error: unknown) => Promise.reject(redactConnectionError(error, config))
  );

const defaultFactories: RedisClientFactories = {
  createStandalone: (options) =>
    createClient(options as never) as unknown as RedisRawClient,
  createCluster: (options) =>
    createCluster(options as never) as unknown as RedisRawCluster,
  createSentinel: (options) =>
    createSentinel(options as never) as unknown as RedisRawClient
};

const withBinaryMapping = (client: RedisRawClient) => {
  client.on("error", () => undefined);
  return client.withTypeMapping({ [RESP_TYPES.BLOB_STRING]: Buffer });
};

const nodeOptions = (config: RedisConfig) => ({
  username: config.username,
  password: config.password,
  socket: {
    tls: config.tls,
    connectTimeout: config.connectTimeoutMs
  },
  commandOptions: {
    timeout: config.commandTimeoutMs
  }
});

const standaloneNodeId = (url: string) => {
  try {
    const parsed = new URL(url);
    parsed.username = "";
    parsed.password = "";
    return parsed.toString();
  } catch {
    return "redis-standalone";
  }
};

const toNode = (id: string, client: RedisRawClient): RedisNode => ({
  id,
  execute: (args) => client.sendCommand(args)
});

const toSentinelMasterNode = (
  id: string,
  client: RedisRawSentinel
): RedisNode => ({
  id,
  execute: (args) => client.sendCommand(true, args)
});

export const createNodeRedisConnection = (
  config: RedisConfig,
  factories: RedisClientFactories = defaultFactories
): RedisConnection => {
  const options = nodeOptions(config);

  if (config.mode === "standalone") {
    const client = withBinaryMapping(
      factories.createStandalone({ url: config.url, ...options })
    );
    return {
      mode: config.mode,
      ready: connectReady(() => client.connect(), config),
      close: () => client.close(),
      executeKey: (args) => client.sendCommand(args),
      primaryNodes: async () => [toNode(standaloneNodeId(config.url), client)],
      sentinelNodes: async () => []
    };
  }

  if (config.mode === "cluster") {
    const cluster = withBinaryMapping(
      factories.createCluster({
        rootNodes: config.nodes.map((url) => ({ url })),
        defaults: options,
        commandOptions: options.commandOptions
      })
    ) as RedisRawCluster;
    return {
      mode: config.mode,
      ready: connectReady(() => cluster.connect(), config),
      close: () => cluster.close(),
      executeKey: (args, routingKey) => {
        const key = routingKey ?? args[1];
        if (!key) {
          throw new Error("Redis key command requires a key");
        }
        return cluster.sendCommand(key, true, args);
      },
      primaryNodes: async () =>
        Promise.all(
          cluster.masters.map(async (master) => {
            const client = withBinaryMapping(await cluster.nodeClient(master));
            return toNode(master.id, client);
          })
        ),
      sentinelNodes: async () => []
    };
  }

  const master = withBinaryMapping(
    factories.createSentinel({
      name: config.masterName,
      sentinelRootNodes: config.nodes,
      nodeClientOptions: options,
      sentinelClientOptions: options,
      commandOptions: options.commandOptions
    })
  ) as unknown as RedisRawSentinel;
  const sentinels = config.nodes.map((node) =>
    withBinaryMapping(
      factories.createStandalone({
        ...options,
        socket: {
          ...options.socket,
          host: node.host,
          port: node.port
        }
      })
    )
  );

  return {
    mode: config.mode,
    ready: Promise.all([
      connectReady(() => master.connect(), config),
      ...sentinels.map((sentinel) => connectReady(() => sentinel.connect(), config))
    ]).then(() => undefined),
    close: async () => {
      await Promise.all([master.close(), ...sentinels.map((sentinel) => sentinel.close())]);
    },
    executeKey: (args) => master.sendCommand(true, args),
    primaryNodes: async () => [toSentinelMasterNode(config.masterName, master)],
    sentinelNodes: async () =>
      sentinels.map((sentinel, index) => {
        const node = config.nodes[index];
        if (!node) {
          throw new Error("Missing Redis Sentinel node configuration");
        }
        return toNode(`${node.host}:${node.port}`, sentinel);
      })
  };
};

export const createRedisReadService = (
  config: RedisConfig,
  createConnection: RedisConnectionFactory
): RedisReadService => {
  const connection = createConnection(config);

  const primaryNodes = async () => {
    await connection.ready;
    const nodes = await connection.primaryNodes();
    if (!nodes.length) {
      throw new Error("No Redis primary node is available");
    }
    return nodes;
  };

  const primaryNode = async () => {
    const nodes = await primaryNodes();
    const node = nodes[0];
    if (!node) {
      throw new Error("No Redis primary node is available");
    }
    return node;
  };

  const executeKey = async (args: string[], routingKey?: string) => {
    await connection.ready;
    return routingKey === undefined
      ? connection.executeKey(args)
      : connection.executeKey(args, routingKey);
  };

  const nodeResults = async <T>(
    execute: (node: RedisNode) => Promise<T>
  ) => Promise.all((await primaryNodes()).map(execute));

  return {
    ready: connection.ready,
    close: connection.close,
    scanKeys: async ({ cursor, match, type, count }) => {
      const resultCount = Math.min(count, config.maxResults);
      if (connection.mode !== "cluster") {
        const args = ["SCAN", cursor ?? "0"];
        if (match) {
          args.push("MATCH", match);
        }
        if (type) {
          args.push("TYPE", type);
        }
        args.push("COUNT", String(resultCount));
        const response = parseScanResponse(await (await primaryNode()).execute(args));
        const normalized = normalizeValues(response.values, config.maxValueBytes);
        return {
          keys: normalized,
          cursor: response.cursor,
          complete: response.cursor === "0",
          truncated: hasTruncatedValue(normalized)
        };
      }

      const nodes = await primaryNodes();
      const parsed = cursor
        ? decodeScanCursor(cursor)
        : {
            version: 1 as const,
            nextNodeIndex: 0,
            nodeCursors: Object.fromEntries(nodes.map((node) => [node.id, "0"]))
          };
      if (parsed.nextNodeIndex < 0 || parsed.nextNodeIndex >= nodes.length) {
        throw new Error("Invalid Redis scan cursor");
      }
      const node = nodes[parsed.nextNodeIndex];
      if (!node) {
        throw new Error("No Redis primary node is available");
      }
      const nodeCursor = parsed.nodeCursors[node.id] ?? "0";
      const args = ["SCAN", nodeCursor];
      if (match) {
        args.push("MATCH", match);
      }
      if (type) {
        args.push("TYPE", type);
      }
      args.push("COUNT", String(resultCount));
      const response = parseScanResponse(await node.execute(args));
      const nodeCursors = Object.fromEntries(
        nodes.map((primary) => [primary.id, parsed.nodeCursors[primary.id] ?? "0"])
      );
      nodeCursors[node.id] = response.cursor;
      const complete = response.cursor === "0" && parsed.nextNodeIndex === nodes.length - 1;
      const nextNodeIndex = response.cursor === "0"
        ? (parsed.nextNodeIndex + 1) % nodes.length
        : parsed.nextNodeIndex;
      const normalized = normalizeValues(response.values, config.maxValueBytes);

      return {
        keys: normalized,
        cursor: complete
          ? "0"
          : encodeScanCursor({ version: 1, nextNodeIndex, nodeCursors }),
        complete,
        truncated: hasTruncatedValue(normalized)
      };
    },
    getKeyMetadata: async (key) => {
      const exists = toInteger(await executeKey(["EXISTS", key]), "exists") > 0;
      if (!exists) {
        return {
          exists: false,
          type: "none",
          ttl_seconds: null,
          memory_bytes: null,
          length: null
        };
      }
      const type = toText(await executeKey(["TYPE", key]));
      const ttl = toInteger(await executeKey(["TTL", key]), "TTL");
      const memory = toInteger(
        await executeKey(["MEMORY", "USAGE", key], key),
        "memory usage"
      );
      const lengthCommand: Record<string, string> = {
        string: "STRLEN",
        hash: "HLEN",
        list: "LLEN",
        set: "SCARD",
        zset: "ZCARD",
        stream: "XLEN"
      };
      const command = lengthCommand[type];
      const length = command
        ? toInteger(await executeKey([command, key]), `${type} length`)
        : null;
      return {
        exists: true,
        type,
        ttl_seconds: ttl,
        memory_bytes: memory,
        length
      };
    },
    getString: async (key) => {
      const result = await executeKey(["GET", key]);
      if (result === null) {
        return { exists: false, value: null };
      }
      return {
        exists: true,
        value: normalizeValue(toBuffer(result), config.maxValueBytes)
      };
    },
    getHash: async ({ key, cursor, match, count }) => {
      const response = parseScanResponse(
        await executeKey(
          scanArguments(
            "HSCAN",
            key,
            cursor ?? "0",
            Math.min(count, config.maxResults),
            match
          )
        )
      );
      if (response.values.length % 2 !== 0) {
        throw new Error("Unexpected Redis hash scan response");
      }
      const entries = Array.from({ length: response.values.length / 2 }, (_, index) => ({
        field: normalizeValue(toBuffer(response.values[index * 2]), config.maxValueBytes),
        value: normalizeValue(toBuffer(response.values[index * 2 + 1]), config.maxValueBytes)
      }));
      return {
        cursor: response.cursor,
        complete: response.cursor === "0",
        entries,
        truncated: entries.some(
          (entry) => entry.field.truncated || entry.value.truncated
        )
      };
    },
    getListRange: async ({ key, start, end }) => {
      const raw = asArray(
        await executeKey(["LRANGE", key, String(start), String(end)]),
        "list range"
      );
      const normalized = normalizeValues(raw, config.maxValueBytes);
      const limited = limitResults(normalized, config.maxResults);
      return {
        values: limited.values,
        truncated: limited.truncated || hasTruncatedValue(limited.values)
      };
    },
    getSetMembers: async ({ key, cursor, match, count }) => {
      const response = parseScanResponse(
        await executeKey(
          scanArguments(
            "SSCAN",
            key,
            cursor ?? "0",
            Math.min(count, config.maxResults),
            match
          )
        )
      );
      const normalized = normalizeValues(response.values, config.maxValueBytes);
      return {
        cursor: response.cursor,
        complete: response.cursor === "0",
        members: normalized,
        truncated: hasTruncatedValue(normalized)
      };
    },
    getSortedSetRange: async ({ key, start, stop, reverse }) => {
      const command = reverse ? "ZREVRANGE" : "ZRANGE";
      const values = asArray(
        await executeKey([command, key, String(start), String(stop), "WITHSCORES"]),
        "sorted set range"
      );
      if (values.length % 2 !== 0) {
        throw new Error("Unexpected Redis sorted set range response");
      }
      const members = Array.from({ length: values.length / 2 }, (_, index) => ({
        value: normalizeValue(toBuffer(values[index * 2]), config.maxValueBytes),
        score: toText(values[index * 2 + 1])
      }));
      const limited = limitResults(members, config.maxResults);
      return {
        members: limited.values,
        truncated: limited.truncated || limited.values.some((member) => member.value.truncated)
      };
    },
    getStreamEntries: async ({ key, start, end, count }) => {
      const values = asArray(
        await executeKey([
          "XRANGE",
          key,
          start,
          end,
          "COUNT",
          String(Math.min(count, config.maxResults))
        ]),
        "stream range"
      );
      const entries = values.map((rawEntry) => {
        const entry = asArray(rawEntry, "stream entry");
        const id = entry[0];
        const rawFields = entry[1];
        if (id === undefined || rawFields === undefined) {
          throw new Error("Unexpected Redis stream entry response");
        }
        const fields = asArray(rawFields, "stream fields");
        if (fields.length % 2 !== 0) {
          throw new Error("Unexpected Redis stream fields response");
        }
        const normalizedFields: Record<string, RedisValue> = {};
        for (let index = 0; index < fields.length; index += 2) {
          const field = fields[index];
          const value = fields[index + 1];
          if (field === undefined || value === undefined) {
            throw new Error("Unexpected Redis stream fields response");
          }
          normalizedFields[toText(field)] = normalizeValue(
            toBuffer(value),
            config.maxValueBytes
          );
        }
        return { id: toText(id), fields: normalizedFields };
      });
      const limited = limitResults(entries, config.maxResults);
      return {
        entries: limited.values,
        truncated: limited.truncated || limited.values.some((entry) =>
          Object.values(entry.fields).some((value) => value.truncated)
        )
      };
    },
    getServerInfo: async (section) => ({
      nodes: await nodeResults(async (node) => ({
        node_id: node.id,
        info: toText(await node.execute(section ? ["INFO", section] : ["INFO"]))
      }))
    }),
    getDatabaseSize: async () => {
      const nodes = await nodeResults(async (node) => ({
        id: node.id,
        size: toInteger(await node.execute(["DBSIZE"]), "database size")
      }));
      return {
        total: nodes.reduce((total, node) => total + node.size, 0),
        nodes
      };
    },
    getClientList: async (type) => {
      const grouped = await nodeResults(async (node) => {
        const output = toText(
          await node.execute(type ? ["CLIENT", "LIST", "TYPE", type] : ["CLIENT", "LIST"])
        );
        return output
          .split(/\r?\n/)
          .filter(Boolean)
          .map((line) => ({ node_id: node.id, ...parseClientLine(line) }));
      });
      const limited = limitResults(grouped.flat(), config.maxResults);
      return { clients: limited.values, truncated: limited.truncated };
    },
    getSlowlog: async (count) => {
      const perNodeCount = Math.min(count, config.slowlogCount, config.maxResults);
      const grouped = await nodeResults(async (node) => {
        const rows = asArray(
          await node.execute(["SLOWLOG", "GET", String(perNodeCount)]),
          "slowlog"
        );
        return rows.map((rawRow) => {
          const row = asArray(rawRow, "slowlog entry");
          return {
            node_id: node.id,
            id: normalizeDiagnostic(row[0]),
            timestamp: normalizeDiagnostic(row[1]),
            duration_microseconds: normalizeDiagnostic(row[2]),
            command: normalizeDiagnostic(row[3]),
            client_address: normalizeDiagnostic(row[4]),
            client_name: normalizeDiagnostic(row[5])
          } as Record<string, unknown>;
        });
      });
      const limited = limitResults(grouped.flat(), config.maxResults);
      return { entries: limited.values, truncated: limited.truncated };
    },
    getTopologyStatus: async () => {
      const nodes = await primaryNodes();
      const roles = await Promise.all(
        nodes.map(async (node) => ({
          node_id: node.id,
          role: normalizeDiagnostic(await node.execute(["ROLE"]))
        }))
      );
      if (connection.mode === "cluster") {
        const cluster = await Promise.all(
          nodes.map(async (node) => ({
            node_id: node.id,
            info: toText(await node.execute(["CLUSTER", "INFO"])),
            nodes: toText(await node.execute(["CLUSTER", "NODES"]))
          }))
        );
        return { mode: connection.mode, roles, cluster };
      }
      if (connection.mode === "sentinel") {
        if (config.mode !== "sentinel") {
          throw new Error("Redis connection mode does not match its configuration");
        }
        const sentinels = await connection.sentinelNodes();
        const sentinel = await Promise.all(
          sentinels.map(async (node) => ({
            node_id: node.id,
            master: normalizeDiagnostic(
              await node.execute(["SENTINEL", "MASTER", config.masterName])
            ),
            sentinels: normalizeDiagnostic(
              await node.execute(["SENTINEL", "SENTINELS", config.masterName])
            ),
            replicas: normalizeDiagnostic(
              await node.execute(["SENTINEL", "REPLICAS", config.masterName])
            )
          }))
        );
        return { mode: connection.mode, roles, sentinel };
      }
      return { mode: connection.mode, roles };
    }
  };
};
