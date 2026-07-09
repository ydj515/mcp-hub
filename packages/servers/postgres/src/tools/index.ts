import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { PostgresConfig } from "../config.js";
import type { PostgresDatabase } from "../services/database.js";
import {
  queryParameter,
  schemaParameter,
  tableParameter,
  type QueryParameter,
  type SchemaParameter,
  type TableParameter
} from "./schemas.js";

const validateSchema = (schema: string, config: PostgresConfig) => {
  if (!config.allowedSchemas.includes(schema)) {
    throw new Error(
      `Schema "${schema}" is not allowed. Allowed schemas: ${config.allowedSchemas.join(", ")}`
    );
  }
};

const jsonText = (value: unknown) => JSON.stringify(value, null, 2);

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
      inputSchema: schemaParameter.shape
    },
    async ({ schema = "public" }: SchemaParameter) => {
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
      inputSchema: tableParameter.shape
    },
    async ({ schema = "public", table_name }: TableParameter) => {
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
    "get_foreign_keys",
    {
      title: "Get Foreign Keys",
      description: "List foreign keys for a PostgreSQL table.",
      inputSchema: tableParameter.shape
    },
    async ({ schema = "public", table_name }: TableParameter) => {
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

  server.registerTool(
    "get_table_stats",
    {
      title: "Get Table Stats",
      description: "Return PostgreSQL table statistics.",
      inputSchema: tableParameter.shape
    },
    async ({ schema = "public", table_name }: TableParameter) => {
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
