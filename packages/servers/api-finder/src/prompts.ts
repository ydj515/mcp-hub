import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export const registerApiFinderPrompts = (server: McpServer) => {
  server.registerPrompt(
    "find_public_api",
    {
      title: "Find a Public Data API",
      description:
        "Guide finding and evaluating a data.go.kr public API for a service idea.",
      argsSchema: {
        keywords: z.string()
      }
    },
    ({ keywords }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: [
              `Find a public data API for: ${keywords}.`,
              "Use search_public_data_api to find candidates,",
              "then get_public_data_api_details to inspect the most relevant specification,",
              "and recommend which API fits best."
            ].join(" ")
          }
        }
      ]
    })
  );
};
