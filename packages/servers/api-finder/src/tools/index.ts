import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  getPublicDataApiDetails,
  searchPublicDataApis,
} from "../services/public-data-api.js";
import {
  detailsParameters,
  searchParameters,
  type DetailsParameters,
  type SearchParameters,
} from "./schemas.js";

export const registerApiFinderTools = (
  server: McpServer,
  env: NodeJS.ProcessEnv,
) => {
  server.registerTool(
    "searchPublicDataAPI",
    {
      title: "Search Public Data API",
      description:
        "Search data.go.kr public APIs for a service idea and keywords.",
      inputSchema: searchParameters.shape,
    },
    async ({ keywords }: SearchParameters) => {
      const apiKey = env.PUBLIC_DATA_API_KEY;
      if (!apiKey) {
        throw new Error("PUBLIC_DATA_API_KEY is required.");
      }

      const results = await searchPublicDataApis({ apiKey, keywords });
      return {
        content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
        structuredContent: { results },
      };
    },
  );

  server.registerTool(
    "getPublicDataAPIDetails",
    {
      title: "Get Public Data API Details",
      description:
        "Fetch the Swagger/OpenAPI specification for a selected public API.",
      inputSchema: detailsParameters.shape,
    },
    async ({ api_id }: DetailsParameters) => {
      const spec = await getPublicDataApiDetails(api_id);
      return {
        content: [{ type: "text", text: JSON.stringify(spec, null, 2) }],
        structuredContent: { spec },
      };
    },
  );
};
