import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { describe, expect, it } from "vitest";
import { registerPostgresPrompts } from "./prompts.js";

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
  registerPostgresPrompts(server);
  return map;
};

describe("registerPostgresPrompts", () => {
  it("registers diagnose_table", () => {
    expect([...collect().keys()]).toEqual(["diagnose_table"]);
  });

  it("builds a message referencing the qualified table and tools", () => {
    const prompt = collect().get("diagnose_table")!;
    const text = prompt.handler({ table_name: "users", schema: "public" })
      .messages[0].content.text;
    expect(text).toContain("public.users");
    expect(text).toContain("describe_table");
    expect(text).toContain("get_index_usage");
  });

  it("omits the schema prefix when not provided", () => {
    const prompt = collect().get("diagnose_table")!;
    const text = prompt.handler({ table_name: "users" }).messages[0].content.text;
    expect(text).toContain("table users.");
    expect(text).not.toContain("undefined");
  });
});
