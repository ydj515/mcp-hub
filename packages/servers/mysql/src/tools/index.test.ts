import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { describe, expect, it, vi } from "vitest";
import type { MySqlConfig } from "../config.js";
import type { MySqlDatabase } from "../services/database.js";
import { registerMySqlTools } from "./index.js";
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

const config: MySqlConfig = {
  mysqlUrl: "mysql://localhost:3306/app",
  allowedSchemas: ["app"],
  maxRows: 500,
  queryTimeoutMs: 10000,
  poolLimit: 1,
  enableWriteTools: false,
  enableDiagnosticTools: false
};

describe("registerMySqlTools", () => {
  it("registers metadata and diagnostics tools", () => {
    const { server, tools } = createServer();

    registerMySqlTools(server, {} as MySqlDatabase, config);

    expect(tools.map((tool) => tool.name)).toEqual(
      expect.arrayContaining([
        "get_server_capabilities",
        "get_indexes",
        "get_constraints",
        "get_partitions",
        "get_table_size",
        "get_table_stats",
        "list_database_objects",
        "list_active_queries",
        "get_locks"
      ])
    );
  });

  it("uses the allowed MySQL schema and default limit for lock diagnostics", async () => {
    const getLocks = vi.fn().mockResolvedValue([{ object_name: "users" }]);
    const { server, tools } = createServer();

    registerMySqlTools(
      server,
      { getLocks } as unknown as MySqlDatabase,
      { ...config, enableDiagnosticTools: true }
    );

    const handler = tools.find((tool) => tool.name === "get_locks")?.handler;
    const result = await handler?.({});

    expect(getLocks).toHaveBeenCalledWith("app", 50);
    expect(result?.structuredContent).toMatchObject({
      schema: "app",
      lock_count: 1
    });
  });

  it("rejects an activity limit above 100", () => {
    expect(() => activityParameter.parse({ limit: 101 })).toThrow();
  });
});
