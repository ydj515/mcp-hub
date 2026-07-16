import { parseBooleanFlag, parseCsv, parsePositiveInt } from "@mcp-hub/core";

export type PostgresConfig = {
  databaseUrl: string;
  allowedSchemas: string[];
  maxRows: number;
  queryTimeoutMs: number;
  poolMax: number;
  enableWriteTools: boolean;
  enableDiagnosticTools: boolean;
};

export const loadPostgresConfig = (
  env: NodeJS.ProcessEnv
): PostgresConfig => {
  if (!env.POSTGRES_URL) {
    throw new Error("POSTGRES_URL is required");
  }

  const allowedSchemas = parseCsv(env.POSTGRES_ALLOWED_SCHEMAS ?? "public");
  if (!allowedSchemas.length) {
    throw new Error("POSTGRES_ALLOWED_SCHEMAS must include at least one schema");
  }

  return {
    databaseUrl: env.POSTGRES_URL,
    allowedSchemas,
    maxRows: parsePositiveInt(env.POSTGRES_MAX_ROWS, 500, "POSTGRES_MAX_ROWS"),
    queryTimeoutMs: parsePositiveInt(
      env.POSTGRES_QUERY_TIMEOUT_MS,
      10000,
      "POSTGRES_QUERY_TIMEOUT_MS"
    ),
    poolMax: parsePositiveInt(env.POSTGRES_POOL_MAX, 5, "POSTGRES_POOL_MAX"),
    enableWriteTools: parseBooleanFlag(
      env.POSTGRES_ENABLE_WRITE_TOOLS,
      "POSTGRES_ENABLE_WRITE_TOOLS"
    ),
    enableDiagnosticTools: parseBooleanFlag(
      env.POSTGRES_ENABLE_DIAGNOSTIC_TOOLS,
      "POSTGRES_ENABLE_DIAGNOSTIC_TOOLS"
    )
  };
};
