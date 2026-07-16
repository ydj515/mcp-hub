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

// data.go.kr 외부 공공데이터 API를 조회만 하므로 read-only이며 외부 세계와 상호작용합니다.
const readOnly = {
  readOnlyHint: true,
  openWorldHint: true,
} as const;

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
      annotations: readOnly,
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
      annotations: readOnly,
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
