import type { McpServer } from "./sdk.js";
import { z } from "zod";
import {
  listShortcutCategories,
  searchShortcuts,
  type ShortcutPlatform
} from "../services/shortcutSearch.js";

const searchShortcutsParameters = z.object({
  query: z
    .string()
    .min(1, "Query is required.")
    .max(300, "Query must be 300 characters or fewer.")
    .describe("Search phrase to match against shortcut actions, keywords, or key bindings."),
  category: z
    .string()
    .min(1, "Category must contain at least one character.")
    .optional()
    .describe("Optional category id or display name to constrain the search results."),
  platform: z
    .enum(["mac", "win"])
    .optional()
    .describe("Filter results to shortcuts that are available on the selected platform."),
  limit: z
    .number()
    .int()
    .min(1)
    .max(25)
    .optional()
    .describe("Maximum number of results to return (default: 10).")
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
              ? categories.map((category) => `- ${category.id}: ${category.name}`).join("\n")
              : "No categories are registered."
          }
        ],
        structuredContent: {
          categories
        }
      };
    }
  );

  server.tool(
    "search_shortcuts",
    "Search keyboard shortcuts by query and optional filters.",
    searchShortcutsParameters.shape,
    async ({ query, category, platform, limit }: z.infer<typeof searchShortcutsParameters>) => {
      const results = searchShortcuts({
        query,
        category,
        platform: platform as ShortcutPlatform | undefined,
        limit
      });

      if (!results.length) {
        return {
          content: [
            {
              type: "text",
              text: `No shortcuts found for "${query}".`
            }
          ],
          structuredContent: {
            query,
            category: category ?? null,
            platform: platform ?? null,
            results: []
          }
        };
      }

      const formattedResults = results.map((result, index) => {
        const bindings =
          platform === "mac"
            ? result.mac
            : platform === "win"
              ? result.win
              : `${result.mac} | ${result.win}`;

        return `${index + 1}. [${result.categoryName}] ${result.action} → ${bindings}`;
      });

      return {
        content: [
          {
            type: "text",
            text: [`Shortcuts for "${query}":`, ...formattedResults].join("\n")
          }
        ],
        structuredContent: {
          query,
          category: category ?? null,
          platform: platform ?? null,
          results: results.map((result) => ({
            categoryId: result.categoryId,
            categoryName: result.categoryName,
            action: result.action,
            mac: result.mac,
            win: result.win,
            score: result.score,
            matchedFields: result.matchedFields,
            matchedKeywords: result.matchedKeywords
          }))
        }
      };
    }
  );
};
