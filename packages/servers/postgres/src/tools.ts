import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { PostgresConfig } from "./config.js";
import type { PostgresDatabase } from "./db.js";

const schemaParameter = z.object({
  schema: z.string().min(1).optional()
});

const tableParameter = z.object({
  schema: z.string().min(1).optional(),
  table_name: z.string().min(1)
});

const queryParameter = z.object({
  sql: z.string().min(1)
});

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
  server.tool(
    "list_tables",
    "List tables in an allowed PostgreSQL schema.",
    schemaParameter.shape,
    async ({ schema = "public" }) => {
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

  server.tool(
    "describe_table",
    "Describe columns for a PostgreSQL table.",
    tableParameter.shape,
    async ({ schema = "public", table_name }) => {
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

  server.tool(
    "run_query",
    "Run a read-only SQL query.",
    queryParameter.shape,
    async ({ sql }) => {
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

  server.tool(
    "get_foreign_keys",
    "List foreign keys for a PostgreSQL table.",
    tableParameter.shape,
    async ({ schema = "public", table_name }) => {
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

  server.tool(
    "explain_query",
    "Return EXPLAIN JSON for a read-only SQL query.",
    queryParameter.shape,
    async ({ sql }) => {
      const plan = await db.explainQuery(sql);
      return {
        content: [{ type: "text", text: jsonText(plan) }],
        structuredContent: { plan }
      };
    }
  );

  server.tool(
    "get_table_stats",
    "Return PostgreSQL table statistics.",
    tableParameter.shape,
    async ({ schema = "public", table_name }) => {
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
