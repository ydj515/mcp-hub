import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  getPublicDataApiDetails,
  searchPublicDataApis
} from "./services/public-data-api.js";

const searchParameters = z.object({
  service_description: z.string().min(1),
  keywords: z.array(z.string().min(1)).min(1)
});

const detailsParameters = z.object({
  api_id: z.string().min(1)
});

export const registerApiFinderTools = (
  server: McpServer,
  env: NodeJS.ProcessEnv
) => {
  server.registerTool(
    "searchPublicDataAPI",
    {
      title: "Search Public Data API",
      description: "Search data.go.kr public APIs for a service idea and keywords.",
      inputSchema: searchParameters.shape
    },
    async ({ keywords }: z.infer<typeof searchParameters>) => {
      const apiKey = env.PUBLIC_DATA_API_KEY;
      if (!apiKey) {
        throw new Error("PUBLIC_DATA_API_KEY is required.");
      }

      const results = await searchPublicDataApis({ apiKey, keywords });
      return {
        content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
        structuredContent: { results }
      };
    }
  );

  server.registerTool(
    "getPublicDataAPIDetails",
    {
      title: "Get Public Data API Details",
      description: "Fetch the Swagger/OpenAPI specification for a selected public API.",
      inputSchema: detailsParameters.shape
    },
    async ({ api_id }: z.infer<typeof detailsParameters>) => {
      const spec = await getPublicDataApiDetails(api_id);
      return {
        content: [{ type: "text", text: JSON.stringify(spec, null, 2) }],
        structuredContent: { spec }
      };
    }
  );
};
