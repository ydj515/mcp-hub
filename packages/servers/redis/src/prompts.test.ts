import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { describe, expect, it } from "vitest";
import { registerRedisPrompts } from "./prompts.js";

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
  registerRedisPrompts(server);
  return map;
};

describe("registerRedisPrompts", () => {
  it("registers diagnose_instance", () => {
    expect([...collect().keys()]).toEqual(["diagnose_instance"]);
  });

  it("builds a message referencing the diagnostic tools", () => {
    const prompt = collect().get("diagnose_instance")!;
    const text = prompt.handler().messages[0].content.text;
    expect(text).toContain("get_server_info");
    expect(text).toContain("get_topology_status");
  });
});
