import { parseBooleanFlag, parseCsv, parsePositiveInt } from "@mcp-hub/core";

export type MySqlConfig = {
  mysqlUrl: string;
  allowedSchemas: string[];
  maxRows: number;
  queryTimeoutMs: number;
  poolLimit: number;
  enableWriteTools: boolean;
  enableDiagnosticTools: boolean;
};

const defaultSchemaFromUrl = (mysqlUrl: string) => {
  const url = new URL(mysqlUrl);
  return decodeURIComponent(url.pathname.replace(/^\//, "")).trim();
};

const parseAllowedSchemas = (env: NodeJS.ProcessEnv, mysqlUrl: string) => {
  const raw = env.MYSQL_ALLOWED_SCHEMAS ?? defaultSchemaFromUrl(mysqlUrl);
  const allowedSchemas = parseCsv(raw);

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
    maxRows: parsePositiveInt(env.MYSQL_MAX_ROWS, 500, "MYSQL_MAX_ROWS"),
    queryTimeoutMs: parsePositiveInt(
      env.MYSQL_QUERY_TIMEOUT_MS,
      10000,
      "MYSQL_QUERY_TIMEOUT_MS"
    ),
    poolLimit: parsePositiveInt(env.MYSQL_POOL_LIMIT, 5, "MYSQL_POOL_LIMIT"),
    enableWriteTools: parseBooleanFlag(
      env.MYSQL_ENABLE_WRITE_TOOLS,
      "MYSQL_ENABLE_WRITE_TOOLS"
    ),
    enableDiagnosticTools: parseBooleanFlag(
      env.MYSQL_ENABLE_DIAGNOSTIC_TOOLS,
      "MYSQL_ENABLE_DIAGNOSTIC_TOOLS"
    )
  };
};
