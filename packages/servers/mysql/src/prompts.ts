import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export const registerMySqlPrompts = (server: McpServer) => {
  server.registerPrompt(
    "diagnose_table",
    {
      title: "Diagnose MySQL Table",
      description:
        "Guide a read-only health check of one MySQL table using the read tools.",
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
              `Diagnose the MySQL table ${schema ? `${schema}.` : ""}${table_name}.`,
              "Use describe_table, get_indexes, get_constraints, get_partitions, get_table_size, and get_table_stats",
              "to review its structure, indexing, and health, then summarize issues and suggest improvements."
            ].join(" ")
          }
        }
      ]
    })
  );
};
