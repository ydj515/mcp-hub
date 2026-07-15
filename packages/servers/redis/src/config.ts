export type RedisSharedConfig = {
  username?: string;
  password?: string;
  tls: boolean;
  maxResults: number;
  maxValueBytes: number;
  scanCount: number;
  slowlogCount: number;
  connectTimeoutMs: number;
  commandTimeoutMs: number;
};

export type RedisStandaloneConfig = RedisSharedConfig & {
  mode: "standalone";
  url: string;
};

export type RedisClusterConfig = RedisSharedConfig & {
  mode: "cluster";
  nodes: string[];
};

export type RedisSentinelConfig = RedisSharedConfig & {
  mode: "sentinel";
  nodes: Array<{ host: string; port: number }>;
  masterName: string;
};

export type RedisConfig =
  | RedisStandaloneConfig
  | RedisClusterConfig
  | RedisSentinelConfig;

const parsePositiveInteger = (
  value: string | undefined,
  fallback: number,
  name: string
) => {
  if (value === undefined) {
    return fallback;
  }

  if (!/^\d+$/.test(value)) {
    throw new Error(`${name} must be a positive integer`);
  }

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }

  return parsed;
};

const parseBoolean = (value: string | undefined, name: string) => {
  if (value === undefined || value === "false") {
    return false;
  }
  if (value === "true") {
    return true;
  }
  throw new Error(`${name} must be true or false`);
};

const parseCsv = (value: string | undefined, name: string) => {
  const items = value
    ?.split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (!items?.length) {
    throw new Error(`${name} must include at least one node`);
  }

  return items;
};

const parseSentinelNode = (value: string) => {
  let parsed: URL;
  try {
    parsed = new URL(`redis://${value}`);
  } catch {
    throw new Error(`Invalid Sentinel node: ${value}`);
  }

  const port = Number(parsed.port);
  if (
    !parsed.hostname ||
    !Number.isSafeInteger(port) ||
    port <= 0 ||
    (parsed.pathname !== "" && parsed.pathname !== "/") ||
    parsed.username ||
    parsed.password
  ) {
    throw new Error(`Invalid Sentinel node: ${value}`);
  }

  return { host: parsed.hostname, port };
};

const loadSharedConfig = (env: NodeJS.ProcessEnv): RedisSharedConfig => ({
  username: env.REDIS_USERNAME,
  password: env.REDIS_PASSWORD,
  tls: parseBoolean(env.REDIS_TLS, "REDIS_TLS"),
  maxResults: parsePositiveInteger(
    env.REDIS_MAX_RESULTS,
    100,
    "REDIS_MAX_RESULTS"
  ),
  maxValueBytes: parsePositiveInteger(
    env.REDIS_MAX_VALUE_BYTES,
    1_048_576,
    "REDIS_MAX_VALUE_BYTES"
  ),
  scanCount: parsePositiveInteger(env.REDIS_SCAN_COUNT, 100, "REDIS_SCAN_COUNT"),
  slowlogCount: parsePositiveInteger(
    env.REDIS_SLOWLOG_COUNT,
    100,
    "REDIS_SLOWLOG_COUNT"
  ),
  connectTimeoutMs: parsePositiveInteger(
    env.REDIS_CONNECT_TIMEOUT_MS,
    10_000,
    "REDIS_CONNECT_TIMEOUT_MS"
  ),
  commandTimeoutMs: parsePositiveInteger(
    env.REDIS_COMMAND_TIMEOUT_MS,
    10_000,
    "REDIS_COMMAND_TIMEOUT_MS"
  )
});

export const loadRedisConfig = (env: NodeJS.ProcessEnv): RedisConfig => {
  const mode = env.REDIS_MODE ?? "standalone";
  const shared = loadSharedConfig(env);

  if (mode === "standalone") {
    if (!env.REDIS_URL) {
      throw new Error("REDIS_URL is required when REDIS_MODE=standalone");
    }
    return { mode, url: env.REDIS_URL, ...shared };
  }

  if (mode === "cluster") {
    return {
      mode,
      nodes: parseCsv(env.REDIS_CLUSTER_NODES, "REDIS_CLUSTER_NODES"),
      ...shared
    };
  }

  if (mode === "sentinel") {
    if (!env.REDIS_SENTINEL_MASTER_NAME) {
      throw new Error(
        "REDIS_SENTINEL_MASTER_NAME is required when REDIS_MODE=sentinel"
      );
    }
    return {
      mode,
      nodes: parseCsv(env.REDIS_SENTINEL_NODES, "REDIS_SENTINEL_NODES").map(
        parseSentinelNode
      ),
      masterName: env.REDIS_SENTINEL_MASTER_NAME,
      ...shared
    };
  }

  throw new Error("REDIS_MODE must be standalone, cluster, or sentinel");
};
