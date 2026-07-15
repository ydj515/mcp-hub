import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { describe, expect, it, vi } from "vitest";
import type { PostgresConfig } from "../config.js";
import type { PostgresDatabase } from "../services/database.js";
import { registerPostgresTools } from "./index.js";
import { activityParameter } from "./schemas.js";

type RegisteredTool = {
  name: string;
  handler: (input: Record<string, unknown>) => Promise<{
    structuredContent?: Record<string, unknown>;
  }>;
};

const createServer = () => {
  const tools: RegisteredTool[] = [];
  const server = {
    registerTool: (
      name: string,
      _definition: unknown,
      handler: RegisteredTool["handler"]
    ) => {
      tools.push({ name, handler });
    }
  } as unknown as McpServer;

  return { server, tools };
};

const config: PostgresConfig = {
  databaseUrl: "postgresql://localhost:5432/app",
  allowedSchemas: ["public"],
  maxRows: 500,
  queryTimeoutMs: 10000,
  poolMax: 1,
  enableWriteTools: false,
  enableDiagnosticTools: false
};

describe("registerPostgresTools", () => {
  it("registers metadata and diagnostics tools", () => {
    const { server, tools } = createServer();

    registerPostgresTools(server, {} as PostgresDatabase, config);

    expect(tools.map((tool) => tool.name)).toEqual(
      expect.arrayContaining([
        "get_server_capabilities",
        "get_indexes",
        "get_constraints",
        "get_partitions",
        "get_table_size",
        "get_table_stats",
        "list_database_objects",
        "get_index_usage",
        "list_active_queries",
        "get_locks"
      ])
    );
  });

  it("uses the first allowed PostgreSQL schema when schema is omitted", async () => {
    const listTables = vi.fn().mockResolvedValue([]);
    const { server, tools } = createServer();
    const customConfig = { ...config, allowedSchemas: ["app"] };

    registerPostgresTools(
      server,
      { listTables } as unknown as PostgresDatabase,
      customConfig
    );

    const handler = tools.find((tool) => tool.name === "list_tables")?.handler;
    await handler?.({});

    expect(listTables).toHaveBeenCalledWith("app");
  });

  it("uses the default limit for PostgreSQL active query diagnostics", async () => {
    const listActiveQueries = vi.fn().mockResolvedValue([{ pid: 10 }]);
    const { server, tools } = createServer();

    registerPostgresTools(
      server,
      { listActiveQueries } as unknown as PostgresDatabase,
      { ...config, enableDiagnosticTools: true }
    );

    const handler = tools.find(
      (tool) => tool.name === "list_active_queries"
    )?.handler;
    const result = await handler?.({});

    expect(listActiveQueries).toHaveBeenCalledWith(50);
    expect(result?.structuredContent).toMatchObject({ query_count: 1 });
  });

  it("rejects an activity limit above 100", () => {
    expect(() => activityParameter.parse({ limit: 101 })).toThrow();
  });
});
