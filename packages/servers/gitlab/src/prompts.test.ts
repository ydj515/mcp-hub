import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { describe, expect, it } from "vitest";
import { registerGitLabPrompts } from "./prompts.js";

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
  registerGitLabPrompts(server);
  return map;
};

describe("registerGitLabPrompts", () => {
  it("registers prepare_mr_review", () => {
    expect([...collect().keys()]).toEqual(["prepare_mr_review"]);
  });

  it("builds a message referencing the merge request and tools", () => {
    const prompt = collect().get("prepare_mr_review")!;
    const text = prompt.handler({
      project_id: "group/app",
      merge_request_iid: "5"
    }).messages[0].content.text;
    expect(text).toContain("!5");
    expect(text).toContain("group/app");
    expect(text).toContain("get_merge_request");
    expect(text).toContain("get_pipeline_jobs");
  });
});
