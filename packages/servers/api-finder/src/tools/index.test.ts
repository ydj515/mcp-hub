import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

const searchPublicDataApis = vi.fn();
const getPublicDataApiDetails = vi.fn();

vi.mock("../services/public-data-api.js", () => ({
  searchPublicDataApis: (...args: unknown[]) => searchPublicDataApis(...args),
  getPublicDataApiDetails: (...args: unknown[]) => getPublicDataApiDetails(...args)
}));

const { registerApiFinderTools } = await import("./index.js");

type Registered = {
  definition: { outputSchema?: Record<string, z.ZodTypeAny> };
  handler: (input: Record<string, unknown>) => Promise<{ structuredContent: unknown }>;
};

const collectTools = (env: NodeJS.ProcessEnv) => {
  const map = new Map<string, Registered>();
  const server = {
    registerTool: (name: string, definition: unknown, handler: unknown) =>
      map.set(name, { definition, handler } as Registered)
  } as unknown as McpServer;
  registerApiFinderTools(server, env);
  return map;
};

const validateOutput = (tool: Registered, structuredContent: unknown) => {
  if (tool.definition.outputSchema) {
    z.object(tool.definition.outputSchema).parse(structuredContent);
  }
};

describe("registerApiFinderTools", () => {
  it("registers snake_case tool names", () => {
    expect([...collectTools({ PUBLIC_DATA_API_KEY: "x" }).keys()]).toEqual([
      "search_public_data_api",
      "get_public_data_api_details"
    ]);
  });

  it("search_public_data_api returns results that satisfy the output schema", async () => {
    searchPublicDataApis.mockResolvedValue([{ id: "1", title: "weather" }]);
    const tool = collectTools({ PUBLIC_DATA_API_KEY: "x" }).get(
      "search_public_data_api"
    )!;
    const result = await tool.handler({ keywords: ["weather"] });
    validateOutput(tool, result.structuredContent);
    expect(
      (result.structuredContent as { results: unknown[] }).results
    ).toHaveLength(1);
  });

  it("get_public_data_api_details returns a spec that satisfies the output schema", async () => {
    getPublicDataApiDetails.mockResolvedValue({ openapi: "3.0.0" });
    const tool = collectTools({ PUBLIC_DATA_API_KEY: "x" }).get(
      "get_public_data_api_details"
    )!;
    const result = await tool.handler({ api_id: "1" });
    validateOutput(tool, result.structuredContent);
  });

  it("search_public_data_api requires PUBLIC_DATA_API_KEY", async () => {
    const tool = collectTools({}).get("search_public_data_api")!;
    await expect(tool.handler({ keywords: ["x"] })).rejects.toThrow(
      "PUBLIC_DATA_API_KEY"
    );
  });
});
