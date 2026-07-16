import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  listShortcutCategories,
  searchShortcuts,
  type ShortcutPlatform
} from "../services/shortcut-search.js";
import {
  searchShortcutsParameters,
  type SearchShortcutsParameters
} from "./schemas.js";

// 정적 단축키 데이터만 조회하므로 모든 tool이 read-only이고 외부 시스템과 무관합니다.
const readOnly = {
  readOnlyHint: true,
  openWorldHint: false
} as const;

const categoriesOutput = {
  categories: z.array(z.unknown())
};

const searchOutput = {
  query: z.string(),
  category: z.unknown(),
  platform: z.unknown(),
  results: z.array(z.unknown())
};

export const registerShortcutTools = (server: McpServer) => {
  server.registerTool(
    "list_shortcut_categories",
    {
      title: "List Shortcut Categories",
      description: "List supported shortcut categories",
      outputSchema: categoriesOutput,
      annotations: readOnly
    },
    async () => {
      const categories = listShortcutCategories();
      return {
        content: [
          {
            type: "text",
            text: categories.length
              ? categories
                  .map((category) => `- ${category.id}: ${category.name}`)
                  .join("\n")
              : "No categories are registered."
          }
        ],
        structuredContent: { categories }
      };
    }
  );

  server.registerTool(
    "search_shortcuts",
    {
      title: "Search Shortcuts",
      description: "Search keyboard shortcuts by query and optional filters.",
      inputSchema: searchShortcutsParameters.shape,
      outputSchema: searchOutput,
      annotations: readOnly
    },
    async ({
      query,
      category,
      platform,
      limit
    }: SearchShortcutsParameters) => {
      const results = searchShortcuts({
        query,
        category,
        platform: platform as ShortcutPlatform | undefined,
        limit
      });

      return {
        content: [
          {
            type: "text",
            text: results.length
              ? [
                  `Shortcuts for "${query}":`,
                  ...results.map((result, index) => {
                    const bindings =
                      platform === "mac"
                        ? result.mac
                        : platform === "win"
                          ? result.win
                          : `${result.mac} | ${result.win}`;
                    return `${index + 1}. [${result.categoryName}] ${result.action} -> ${bindings}`;
                  })
                ].join("\n")
              : `No shortcuts found for "${query}".`
          }
        ],
        structuredContent: {
          query,
          category: category ?? null,
          platform: platform ?? null,
          results
        }
      };
    }
  );
};
