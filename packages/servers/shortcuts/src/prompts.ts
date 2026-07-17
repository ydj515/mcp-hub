import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export const registerShortcutPrompts = (server: McpServer) => {
  server.registerPrompt(
    "find_shortcut",
    {
      title: "Find Keyboard Shortcuts",
      description:
        "Guide finding keyboard shortcuts for a task using the search tools.",
      argsSchema: {
        query: z.string(),
        platform: z.string().optional()
      }
    },
    ({ query, platform }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: [
              `Find keyboard shortcuts for "${query}"${platform ? ` on ${platform}` : ""}.`,
              "Use list_shortcut_categories to see available categories,",
              "then search_shortcuts to find matching shortcuts, and present the most relevant ones."
            ].join(" ")
          }
        }
      ]
    })
  );
};
