export type PostgresConfig = {
  databaseUrl: string;
  allowedSchemas: string[];
  maxRows: number;
  queryTimeoutMs: number;
  poolMax: number;
};

const parsePositiveInteger = (
  value: string | undefined,
  fallback: number,
  name: string
) => {
  if (!value) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return parsed;
};

export const loadPostgresConfig = (
  env: NodeJS.ProcessEnv
): PostgresConfig => {
  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  return {
    databaseUrl: env.DATABASE_URL,
    allowedSchemas: (env.ALLOWED_SCHEMAS ?? "public")
      .split(",")
      .map((schema) => schema.trim())
      .filter(Boolean),
    maxRows: parsePositiveInteger(env.MAX_ROWS, 500, "MAX_ROWS"),
    queryTimeoutMs: parsePositiveInteger(
      env.QUERY_TIMEOUT_MS,
      10000,
      "QUERY_TIMEOUT_MS"
    ),
    poolMax: parsePositiveInteger(env.PG_POOL_MAX, 5, "PG_POOL_MAX")
  };
};
