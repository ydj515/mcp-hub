import { assertFeatureEnabled } from "@mcp-hub/core";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { MySqlConfig } from "../config.js";
import type { MySqlDatabase } from "../services/database.js";
import {
  activityParameter,
  queryParameter,
  schemaParameter,
  schemaActivityParameter,
  tableParameter,
  writeQueryParameter,
  type ActivityParameter,
  type QueryParameter,
  type SchemaActivityParameter,
  type SchemaParameter,
  type TableParameter,
  type WriteQueryParameter
} from "./schemas.js";

const validateSchema = (schema: string, config: MySqlConfig) => {
  if (!config.allowedSchemas.includes(schema)) {
    throw new Error(
      `Schema "${schema}" is not allowed. Allowed schemas: ${config.allowedSchemas.join(", ")}`
    );
  }
};

const defaultSchema = (config: MySqlConfig) => config.allowedSchemas[0];

const assertWriteToolsEnabled = (config: MySqlConfig) =>
  assertFeatureEnabled(
    config.enableWriteTools,
    "MySQL write tools are disabled. Set MYSQL_ENABLE_WRITE_TOOLS=true to enable run_write_query."
  );

const assertDiagnosticToolsEnabled = (config: MySqlConfig) =>
  assertFeatureEnabled(
    config.enableDiagnosticTools,
    "MySQL diagnostic tools are disabled. Set MYSQL_ENABLE_DIAGNOSTIC_TOOLS=true to enable list_active_queries and get_locks."
  );

const jsonText = (value: unknown) => JSON.stringify(value, null, 2);

const toolResult = (payload: Record<string, unknown>) => ({
  content: [{ type: "text" as const, text: jsonText(payload) }],
  structuredContent: payload
});

export const registerMySqlTools = (
  server: McpServer,
  db: MySqlDatabase,
  config: MySqlConfig
) => {
  server.registerTool(
    "list_tables",
    {
      title: "List Tables",
      description: "List tables in an allowed MySQL schema.",
      inputSchema: schemaParameter.shape
    },
    async ({ schema = defaultSchema(config) }: SchemaParameter) => {
      validateSchema(schema, config);
      const tables = await db.listTables(schema);
      return {
        content: [
          {
            type: "text",
            text: jsonText({ schema, table_count: tables.length, tables })
          }
        ],
        structuredContent: { schema, table_count: tables.length, tables }
      };
    }
  );

  server.registerTool(
    "describe_table",
    {
      title: "Describe Table",
      description: "Describe columns for a MySQL table.",
      inputSchema: tableParameter.shape
    },
    async ({ schema = defaultSchema(config), table_name }: TableParameter) => {
      validateSchema(schema, config);
      const columns = await db.describeTable(schema, table_name);
      return {
        content: [
          {
            type: "text",
            text: jsonText({ table: `${schema}.${table_name}`, columns })
          }
        ],
        structuredContent: { table: `${schema}.${table_name}`, columns }
      };
    }
  );

  server.registerTool(
    "run_query",
    {
      title: "Run Query",
      description: "Run a read-only MySQL query.",
      inputSchema: queryParameter.shape
    },
    async ({ sql }: QueryParameter) => {
      const rows = await db.runReadOnlyQuery(sql);
      return {
        content: [
          {
            type: "text",
            text: jsonText({
              row_count: rows.length,
              max_rows: config.maxRows,
              rows
            })
          }
        ],
        structuredContent: {
          row_count: rows.length,
          max_rows: config.maxRows,
          rows
        }
      };
    }
  );

  server.registerTool(
    "get_server_capabilities",
    {
      title: "Get Server Capabilities",
      description:
        "Return MySQL version, SQL mode, default storage engine, and available storage engines."
    },
    async () => {
      const capabilities = await db.getServerCapabilities();
      return toolResult({ capabilities });
    }
  );

  server.registerTool(
    "get_indexes",
    {
      title: "Get Indexes",
      description:
        "List MySQL index key parts, uniqueness, type, cardinality, visibility, and functional expressions for a table.",
      inputSchema: tableParameter.shape
    },
    async ({ schema = defaultSchema(config), table_name }: TableParameter) => {
      validateSchema(schema, config);
      const indexes = await db.getIndexes(schema, table_name);
      return toolResult({ table: `${schema}.${table_name}`, indexes });
    }
  );

  server.registerTool(
    "get_constraints",
    {
      title: "Get Constraints",
      description:
        "List MySQL primary key, unique, foreign key, and check constraints for a table.",
      inputSchema: tableParameter.shape
    },
    async ({ schema = defaultSchema(config), table_name }: TableParameter) => {
      validateSchema(schema, config);
      const constraints = await db.getConstraints(schema, table_name);
      return toolResult({ table: `${schema}.${table_name}`, constraints });
    }
  );

  server.registerTool(
    "get_partitions",
    {
      title: "Get Partitions",
      description:
        "List MySQL partition and subpartition definitions, bounds, and estimated sizes for a table.",
      inputSchema: tableParameter.shape
    },
    async ({ schema = defaultSchema(config), table_name }: TableParameter) => {
      validateSchema(schema, config);
      const partitions = await db.getPartitions(schema, table_name);
      return toolResult({ table: `${schema}.${table_name}`, partitions });
    }
  );

  server.registerTool(
    "get_table_size",
    {
      title: "Get Table Size",
      description:
        "Return MySQL estimated rows and data, index, free-space, and total table sizes in bytes.",
      inputSchema: tableParameter.shape
    },
    async ({ schema = defaultSchema(config), table_name }: TableParameter) => {
      validateSchema(schema, config);
      const size = await db.getTableSize(schema, table_name);
      return toolResult({ table: `${schema}.${table_name}`, size });
    }
  );

  server.registerTool(
    "get_table_stats",
    {
      title: "Get Table Stats",
      description:
        "Return MySQL storage engine, estimated rows, row length, allocation, and maintenance timestamps for a table.",
      inputSchema: tableParameter.shape
    },
    async ({ schema = defaultSchema(config), table_name }: TableParameter) => {
      validateSchema(schema, config);
      const stats = await db.getTableStats(schema, table_name);
      return toolResult({ table: `${schema}.${table_name}`, stats });
    }
  );

  server.registerTool(
    "list_database_objects",
    {
      title: "List Database Objects",
      description:
        "List MySQL tables, views, triggers, routines, and events in an allowed schema.",
      inputSchema: schemaParameter.shape
    },
    async ({ schema = defaultSchema(config) }: SchemaParameter) => {
      validateSchema(schema, config);
      const objects = await db.listDatabaseObjects(schema);
      return toolResult({ schema, object_count: objects.length, objects });
    }
  );

  server.registerTool(
    "list_active_queries",
    {
      title: "List Active Queries",
      description:
        "List non-sleeping MySQL queries in allowed schemas. Requires MYSQL_ENABLE_DIAGNOSTIC_TOOLS=true. Query text is truncated to 1,000 characters.",
      inputSchema: activityParameter.shape
    },
    async ({ limit = 50 }: ActivityParameter) => {
      assertDiagnosticToolsEnabled(config);
      const queries = await db.listActiveQueries(limit);
      return toolResult({ query_count: queries.length, queries });
    }
  );

  server.registerTool(
    "get_locks",
    {
      title: "Get Locks",
      description:
        "List MySQL InnoDB locks for an allowed schema using Performance Schema. Requires MYSQL_ENABLE_DIAGNOSTIC_TOOLS=true and access to performance_schema.data_locks.",
      inputSchema: schemaActivityParameter.shape
    },
    async ({
      schema = defaultSchema(config),
      limit = 50
    }: SchemaActivityParameter) => {
      validateSchema(schema, config);
      assertDiagnosticToolsEnabled(config);
      const locks = await db.getLocks(schema, limit);
      return toolResult({ schema, lock_count: locks.length, locks });
    }
  );

  server.registerTool(
    "run_write_query",
    {
      title: "Run Write Query",
      description:
        "Run one permitted MySQL DML or maintenance statement. Requires MYSQL_ENABLE_WRITE_TOOLS=true.",
      inputSchema: writeQueryParameter.shape
    },
    async ({ sql }: WriteQueryParameter) => {
      assertWriteToolsEnabled(config);
      const result = await db.runWriteQuery(sql);
      const payload = {
        affected_rows: result.affectedRows,
        row_count: result.rows.length,
        rows: result.rows
      };
      return {
        content: [{ type: "text", text: jsonText(payload) }],
        structuredContent: payload
      };
    }
  );

  server.registerTool(
    "get_foreign_keys",
    {
      title: "Get Foreign Keys",
      description: "List foreign keys for a MySQL table.",
      inputSchema: tableParameter.shape
    },
    async ({ schema = defaultSchema(config), table_name }: TableParameter) => {
      validateSchema(schema, config);
      const foreign_keys = await db.getForeignKeys(schema, table_name);
      return {
        content: [
          {
            type: "text",
            text: jsonText({ table: `${schema}.${table_name}`, foreign_keys })
          }
        ],
        structuredContent: { table: `${schema}.${table_name}`, foreign_keys }
      };
    }
  );

  server.registerTool(
    "explain_query",
    {
      title: "Explain Query",
      description: "Return EXPLAIN JSON for a read-only MySQL query.",
      inputSchema: queryParameter.shape
    },
    async ({ sql }: QueryParameter) => {
      const plan = await db.explainQuery(sql);
      return {
        content: [{ type: "text", text: jsonText(plan) }],
        structuredContent: { plan }
      };
    }
  );
};
