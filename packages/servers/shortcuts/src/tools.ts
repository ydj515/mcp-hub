import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  listShortcutCategories,
  searchShortcuts,
  type ShortcutPlatform
} from "./services/shortcutSearch.js";

const searchShortcutsParameters = z.object({
  query: z.string().min(1).max(300),
  category: z.string().min(1).optional(),
  platform: z.enum(["mac", "win"]).optional(),
  limit: z.number().int().min(1).max(25).optional()
});

export const registerShortcutTools = (server: McpServer) => {
  server.tool(
    "list_shortcut_categories",
    "List supported shortcut categories",
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

  server.tool(
    "search_shortcuts",
    "Search keyboard shortcuts by query and optional filters.",
    searchShortcutsParameters.shape,
    async ({
      query,
      category,
      platform,
      limit
    }: z.infer<typeof searchShortcutsParameters>) => {
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
