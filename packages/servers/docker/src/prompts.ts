import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export const registerDockerPrompts = (server: McpServer) => {
  server.registerPrompt(
    "diagnose_compose",
    {
      title: "Diagnose Docker Compose Project",
      description:
        "Guide a read-only health check of one configured Docker Compose project.",
      argsSchema: {
        project: z.string()
      }
    },
    ({ project }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: [
              `Diagnose the Docker Compose project "${project}".`,
              "Use get_compose_health_status, get_compose_events, and get_compose_logs",
              "to review container health, recent events, and logs, then summarize problems and next steps."
            ].join(" ")
          }
        }
      ]
    })
  );
};
