import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { describe, expect, it } from "vitest";
import { registerShortcutPrompts } from "./prompts.js";

type PromptResult = {
  messages: Array<{ role: string; content: { type: string; text: string } }>;
};
type Registered = {
  config: { title?: string; description?: string };
  handler: (args?: Record<string, unknown>) => PromptResult;
};

const collect = () => {
  const map = new Map<string, Registered>();
  const server = {
    registerPrompt: (name: string, config: unknown, handler: unknown) =>
      map.set(name, { config, handler } as Registered)
  } as unknown as McpServer;
  registerShortcutPrompts(server);
  return map;
};

describe("registerShortcutPrompts", () => {
  it("registers find_shortcut", () => {
    expect([...collect().keys()]).toEqual(["find_shortcut"]);
  });

  it("includes the platform when provided", () => {
    const prompt = collect().get("find_shortcut")!;
    const text = prompt.handler({ query: "split editor", platform: "mac" })
      .messages[0].content.text;
    expect(text).toContain("split editor");
    expect(text).toContain("on mac");
    expect(text).toContain("list_shortcut_categories");
    expect(text).toContain("search_shortcuts");
  });

  it("omits the platform clause when not provided", () => {
    const prompt = collect().get("find_shortcut")!;
    const text = prompt.handler({ query: "split editor" }).messages[0].content
      .text;
    expect(text).not.toContain("undefined");
    expect(text).not.toContain(" on ");
  });
});
