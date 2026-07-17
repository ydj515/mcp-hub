import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { describe, expect, it } from "vitest";
import { registerDockerPrompts } from "./prompts.js";

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
  registerDockerPrompts(server);
  return map;
};

describe("registerDockerPrompts", () => {
  it("registers diagnose_compose", () => {
    expect([...collect().keys()]).toEqual(["diagnose_compose"]);
  });

  it("builds a message referencing the project and tools", () => {
    const prompt = collect().get("diagnose_compose")!;
    const text = prompt.handler({ project: "app" }).messages[0].content.text;
    expect(text).toContain('"app"');
    expect(text).toContain("get_compose_health_status");
    expect(text).toContain("get_compose_logs");
  });
});
