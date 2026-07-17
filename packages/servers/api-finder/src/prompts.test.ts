import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { describe, expect, it } from "vitest";
import { registerApiFinderPrompts } from "./prompts.js";

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
  registerApiFinderPrompts(server);
  return map;
};

describe("registerApiFinderPrompts", () => {
  it("registers find_public_api", () => {
    expect([...collect().keys()]).toEqual(["find_public_api"]);
  });

  it("builds a message referencing the keywords and tools", () => {
    const prompt = collect().get("find_public_api")!;
    const text = prompt.handler({ keywords: "bus arrival" }).messages[0].content
      .text;
    expect(text).toContain("bus arrival");
    expect(text).toContain("search_public_data_api");
    expect(text).toContain("get_public_data_api_details");
  });
});
