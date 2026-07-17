import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export const registerPostgresPrompts = (server: McpServer) => {
  server.registerPrompt(
    "diagnose_table",
    {
      title: "Diagnose PostgreSQL Table",
      description:
        "Guide a read-only health check of one PostgreSQL table using the read tools.",
      argsSchema: {
        table_name: z.string(),
        schema: z.string().optional()
      }
    },
    ({ table_name, schema }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: [
              `Diagnose the PostgreSQL table ${schema ? `${schema}.` : ""}${table_name}.`,
              "Use describe_table, get_indexes, get_constraints, get_table_size, get_index_usage, and get_table_stats",
              "to review its structure, indexing, and health, then summarize issues and suggest improvements."
            ].join(" ")
          }
        }
      ]
    })
  );
};
