import { assertFeatureEnabled } from "@mcp-hub/core";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { PostgresConfig } from "../config.js";
import type { PostgresDatabase } from "../services/database.js";
import {
  activityParameter,
  indexUsageParameter,
  queryParameter,
  schemaParameter,
  schemaActivityParameter,
  tableParameter,
  writeQueryParameter,
  type ActivityParameter,
  type IndexUsageParameter,
  type QueryParameter,
  type SchemaActivityParameter,
  type SchemaParameter,
  type TableParameter,
  type WriteQueryParameter
} from "./schemas.js";

// introspection·조회·EXPLAIN·진단 tool은 데이터를 바꾸지 않으며 특정 DB에 국한됩니다.
const readOnly = {
  readOnlyHint: true,
  openWorldHint: false
} as const;

// run_write_query는 허용된 DML/유지보수 문을 실행하므로 파괴적이고 멱등하지 않습니다.
const writeQuery = {
  readOnlyHint: false,
  destructiveHint: true,
  idempotentHint: false,
  openWorldHint: false
} as const;

const validateSchema = (schema: string, config: PostgresConfig) => {
  if (!config.allowedSchemas.includes(schema)) {
    throw new Error(
      `Schema "${schema}" is not allowed. Allowed schemas: ${config.allowedSchemas.join(", ")}`
    );
  }
};

const defaultSchema = (config: PostgresConfig) => config.allowedSchemas[0];

const assertWriteToolsEnabled = (config: PostgresConfig) =>
  assertFeatureEnabled(
    config.enableWriteTools,
    "PostgreSQL write tools are disabled. Set POSTGRES_ENABLE_WRITE_TOOLS=true to enable run_write_query."
  );

const assertDiagnosticToolsEnabled = (config: PostgresConfig) =>
  assertFeatureEnabled(
    config.enableDiagnosticTools,
    "PostgreSQL diagnostic tools are disabled. Set POSTGRES_ENABLE_DIAGNOSTIC_TOOLS=true to enable list_active_queries and get_locks."
  );

const jsonText = (value: unknown) => JSON.stringify(value, null, 2);

const toolResult = (payload: Record<string, unknown>) => ({
  content: [{ type: "text" as const, text: jsonText(payload) }],
  structuredContent: payload
});

export const registerPostgresTools = (
  server: McpServer,
  db: PostgresDatabase,
  config: PostgresConfig
) => {
  server.registerTool(
    "list_tables",
    {
      title: "List Tables",
      description: "List tables in an allowed PostgreSQL schema.",
      inputSchema: schemaParameter.shape,
      annotations: readOnly
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
      description: "Describe columns for a PostgreSQL table.",
      inputSchema: tableParameter.shape,
      annotations: readOnly
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
      description: "Run a read-only SQL query.",
      inputSchema: queryParameter.shape,
      annotations: readOnly
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
    "run_write_query",
    {
      title: "Run Write Query",
      description:
        "Run one permitted PostgreSQL DML or maintenance statement. Requires POSTGRES_ENABLE_WRITE_TOOLS=true.",
      inputSchema: writeQueryParameter.shape,
      annotations: writeQuery
    },
    async ({ sql }: WriteQueryParameter) => {
      assertWriteToolsEnabled(config);
      const result = await db.runWriteQuery(sql);
      const payload = {
        command: result.command,
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
    "get_server_capabilities",
    {
      title: "Get Server Capabilities",
      description:
        "Return PostgreSQL version, current database, encoding, and installed extensions.",
      annotations: readOnly
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
        "List PostgreSQL index definitions, key parts, access methods, uniqueness, validity, predicates, and INCLUDE columns for a table.",
      inputSchema: tableParameter.shape,
      annotations: readOnly
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
        "List PostgreSQL primary key, unique, foreign key, and check constraints for a table.",
      inputSchema: tableParameter.shape,
      annotations: readOnly
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
        "List all PostgreSQL descendant partitions, partition key, parent, boundary, and tree depth for a table.",
      inputSchema: tableParameter.shape,
      annotations: readOnly
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
        "Return PostgreSQL estimated rows and table, index, and total relation sizes in bytes and readable units.",
      inputSchema: tableParameter.shape,
      annotations: readOnly
    },
    async ({ schema = defaultSchema(config), table_name }: TableParameter) => {
      validateSchema(schema, config);
      const size = await db.getTableSize(schema, table_name);
      return toolResult({ table: `${schema}.${table_name}`, size });
    }
  );

  server.registerTool(
    "list_database_objects",
    {
      title: "List Database Objects",
      description:
        "List PostgreSQL tables, views, materialized views, sequences, functions, procedures, and triggers in an allowed schema.",
      inputSchema: schemaParameter.shape,
      annotations: readOnly
    },
    async ({ schema = defaultSchema(config) }: SchemaParameter) => {
      validateSchema(schema, config);
      const objects = await db.listDatabaseObjects(schema);
      return toolResult({ schema, object_count: objects.length, objects });
    }
  );

  server.registerTool(
    "get_index_usage",
    {
      title: "Get Index Usage",
      description:
        "Return PostgreSQL cumulative index scan and tuple counters. Statistics reset and workload patterns must be considered before removing an index.",
      inputSchema: indexUsageParameter.shape,
      annotations: readOnly
    },
    async ({
      schema = defaultSchema(config),
      table_name
    }: IndexUsageParameter) => {
      validateSchema(schema, config);
      const index_usage = await db.getIndexUsage(schema, table_name);
      return toolResult({
        schema,
        table_name: table_name ?? null,
        index_usage_count: index_usage.length,
        index_usage
      });
    }
  );

  server.registerTool(
    "list_active_queries",
    {
      title: "List Active Queries",
      description:
        "List non-idle PostgreSQL queries in the current database. Requires POSTGRES_ENABLE_DIAGNOSTIC_TOOLS=true. Query text is truncated to 1,000 characters and visibility depends on pg_stat_activity privileges.",
      inputSchema: activityParameter.shape,
      annotations: readOnly
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
        "List PostgreSQL relation locks in an allowed schema with waiting state and blocking backend IDs. Requires POSTGRES_ENABLE_DIAGNOSTIC_TOOLS=true. Query text is truncated to 1,000 characters.",
      inputSchema: schemaActivityParameter.shape,
      annotations: readOnly
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
    "get_foreign_keys",
    {
      title: "Get Foreign Keys",
      description: "List foreign keys for a PostgreSQL table.",
      inputSchema: tableParameter.shape,
      annotations: readOnly
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
      description: "Return EXPLAIN JSON for a read-only SQL query.",
      inputSchema: queryParameter.shape,
      annotations: readOnly
    },
    async ({ sql }: QueryParameter) => {
      const plan = await db.explainQuery(sql);
      return {
        content: [{ type: "text", text: jsonText(plan) }],
        structuredContent: { plan }
      };
    }
  );

  server.registerTool(
    "get_table_stats",
    {
      title: "Get Table Stats",
      description: "Return PostgreSQL table statistics.",
      inputSchema: tableParameter.shape,
      annotations: readOnly
    },
    async ({ schema = defaultSchema(config), table_name }: TableParameter) => {
      validateSchema(schema, config);
      const stats = await db.getTableStats(schema, table_name);
      return {
        content: [
          {
            type: "text",
            text: jsonText({ table: `${schema}.${table_name}`, stats })
          }
        ],
        structuredContent: { table: `${schema}.${table_name}`, stats }
      };
    }
  );
};
