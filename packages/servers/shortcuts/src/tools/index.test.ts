import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { registerShortcutTools } from "./index.js";

type Registered = {
  definition: { outputSchema?: Record<string, z.ZodTypeAny> };
  handler: (input: Record<string, unknown>) => Promise<{ structuredContent: unknown }>;
};

const collectTools = () => {
  const map = new Map<string, Registered>();
  const server = {
    registerTool: (name: string, definition: unknown, handler: unknown) =>
      map.set(name, { definition, handler } as Registered)
  } as unknown as McpServer;
  registerShortcutTools(server);
  return map;
};

// outputSchema가 있으면 실제 반환 structuredContent가 스키마를 만족하는지 검증합니다.
const validateOutput = (tool: Registered, structuredContent: unknown) => {
  if (tool.definition.outputSchema) {
    z.object(tool.definition.outputSchema).parse(structuredContent);
  }
};

describe("registerShortcutTools", () => {
  it("registers the shortcut tools", () => {
    expect([...collectTools().keys()]).toEqual([
      "list_shortcut_categories",
      "search_shortcuts"
    ]);
  });

  it("list_shortcut_categories returns categories that satisfy the output schema", async () => {
    const tool = collectTools().get("list_shortcut_categories")!;
    const result = await tool.handler({});
    validateOutput(tool, result.structuredContent);
    expect(
      Array.isArray(
        (result.structuredContent as { categories: unknown[] }).categories
      )
    ).toBe(true);
  });

  it("search_shortcuts returns null filters that satisfy the nullable output schema", async () => {
    const tool = collectTools().get("search_shortcuts")!;
    const result = await tool.handler({ query: "copy" });
    validateOutput(tool, result.structuredContent);
    const sc = result.structuredContent as {
      query: string;
      category: unknown;
      platform: unknown;
      results: unknown[];
    };
    expect(sc.query).toBe("copy");
    expect(sc.category).toBeNull();
    expect(sc.platform).toBeNull();
    expect(Array.isArray(sc.results)).toBe(true);
  });

  it("search_shortcuts preserves the platform enum value", async () => {
    const tool = collectTools().get("search_shortcuts")!;
    const result = await tool.handler({
      query: "copy",
      platform: "mac",
      category: "editing"
    });
    validateOutput(tool, result.structuredContent);
    expect((result.structuredContent as { platform: string }).platform).toBe(
      "mac"
    );
  });
});
