import { describe, expect, it } from "vitest";
import { listShortcutCategories, searchShortcuts } from "./shortcut-search.js";

describe("shortcut-search", () => {
  it("lists registered categories", () => {
    const categories = listShortcutCategories();
    expect(categories.length).toBeGreaterThan(0);
    expect(categories[0]).toHaveProperty("id");
    expect(categories[0]).toHaveProperty("name");
  });

  it("returns scored shortcut results for a query", () => {
    const results = searchShortcuts({ query: "copy", limit: 5 });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].score).toBeGreaterThan(0);
  });
});
