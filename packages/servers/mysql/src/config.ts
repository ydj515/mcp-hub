export type MySqlConfig = {
  mysqlUrl: string;
  allowedSchemas: string[];
  maxRows: number;
  queryTimeoutMs: number;
  poolLimit: number;
  enableWriteTools: boolean;
  enableDiagnosticTools: boolean;
};

const parseBoolean = (value: string | undefined) =>
  value?.toLowerCase() === "true";

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

const defaultSchemaFromUrl = (mysqlUrl: string) => {
  const url = new URL(mysqlUrl);
  return decodeURIComponent(url.pathname.replace(/^\//, "")).trim();
};

const parseAllowedSchemas = (env: NodeJS.ProcessEnv, mysqlUrl: string) => {
  const raw = env.MYSQL_ALLOWED_SCHEMAS ?? defaultSchemaFromUrl(mysqlUrl);
  const allowedSchemas = raw
    .split(",")
    .map((schema) => schema.trim())
    .filter(Boolean);

  if (!allowedSchemas.length) {
    throw new Error("MYSQL_ALLOWED_SCHEMAS must include at least one schema");
  }

  return allowedSchemas;
};

export const loadMySqlConfig = (env: NodeJS.ProcessEnv): MySqlConfig => {
  if (!env.MYSQL_URL) {
    throw new Error("MYSQL_URL is required");
  }

  return {
    mysqlUrl: env.MYSQL_URL,
    allowedSchemas: parseAllowedSchemas(env, env.MYSQL_URL),
    maxRows: parsePositiveInteger(env.MYSQL_MAX_ROWS, 500, "MYSQL_MAX_ROWS"),
    queryTimeoutMs: parsePositiveInteger(
      env.MYSQL_QUERY_TIMEOUT_MS,
      10000,
      "MYSQL_QUERY_TIMEOUT_MS"
    ),
    poolLimit: parsePositiveInteger(
      env.MYSQL_POOL_LIMIT,
      5,
      "MYSQL_POOL_LIMIT"
    ),
    enableWriteTools: parseBoolean(env.MYSQL_ENABLE_WRITE_TOOLS),
    enableDiagnosticTools: parseBoolean(env.MYSQL_ENABLE_DIAGNOSTIC_TOOLS)
  };
};
