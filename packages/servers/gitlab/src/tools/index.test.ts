import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import type { GitLabConfig } from "../config.js";
import type { GitLabClient } from "../services/gitlab.js";
import { registerGitLabTools } from "./index.js";

const baseConfig: GitLabConfig = {
  baseUrl: "https://gitlab.com",
  apiBaseUrl: "https://gitlab.com/api/v4",
  token: "t",
  authMode: "private-token",
  enableWriteTools: false,
  maxPerPage: 50,
  maxFileBytes: 1_048_576,
  timeoutMs: 10_000
};

const createClient = () => ({
  getCurrentUser: vi.fn().mockResolvedValue({ id: 1, username: "u" }),
  searchProjects: vi.fn().mockResolvedValue({ items: [], pagination: {} }),
  getProject: vi.fn().mockResolvedValue({ id: 1 }),
  listIssues: vi.fn().mockResolvedValue({ items: [], pagination: {} }),
  getIssue: vi.fn().mockResolvedValue({ iid: 1 }),
  listMergeRequests: vi.fn().mockResolvedValue({ items: [], pagination: {} }),
  getMergeRequest: vi.fn().mockResolvedValue({ iid: 1 }),
  listProjectBranches: vi.fn().mockResolvedValue({ items: [], pagination: {} }),
  listCommits: vi.fn().mockResolvedValue({ items: [], pagination: {} }),
  getFile: vi.fn().mockResolvedValue({ file_path: "a.txt", encoding: "text" }),
  listPipelines: vi.fn().mockResolvedValue({ items: [], pagination: {} }),
  getPipelineJobs: vi.fn().mockResolvedValue({ items: [], pagination: {} }),
  createIssue: vi.fn().mockResolvedValue({ iid: 2 }),
  createMergeRequest: vi.fn().mockResolvedValue({ iid: 2 }),
  createIssueNote: vi.fn().mockResolvedValue({ id: 3 }),
  createMergeRequestNote: vi.fn().mockResolvedValue({ id: 3 }),
  approveMergeRequest: vi.fn().mockResolvedValue({ iid: 1 }),
  mergeMergeRequest: vi.fn().mockResolvedValue({ iid: 1 })
});

type Registered = {
  definition: { outputSchema?: Record<string, z.ZodTypeAny> };
  handler: (input: Record<string, unknown>) => Promise<{ structuredContent: unknown }>;
};

const collectTools = (config: GitLabConfig) => {
  const map = new Map<string, Registered>();
  const server = {
    registerTool: (name: string, definition: unknown, handler: unknown) =>
      map.set(name, { definition, handler } as Registered)
  } as unknown as McpServer;
  registerGitLabTools(server, createClient() as unknown as GitLabClient, config);
  return map;
};

const validateOutput = (tool: Registered, structuredContent: unknown) => {
  if (tool.definition.outputSchema) {
    z.object(tool.definition.outputSchema).parse(structuredContent);
  }
};

describe("registerGitLabTools", () => {
  it("registers all read and write tools", () => {
    expect([...collectTools(baseConfig).keys()]).toEqual([
      "get_current_user",
      "search_projects",
      "get_project",
      "list_issues",
      "get_issue",
      "list_merge_requests",
      "get_merge_request",
      "list_project_branches",
      "list_commits",
      "get_file",
      "list_pipelines",
      "get_pipeline_jobs",
      "create_issue",
      "create_merge_request",
      "create_issue_note",
      "create_merge_request_note",
      "approve_merge_request",
      "merge_merge_request"
    ]);
  });

  it("wraps read results with gitlab_instance and satisfies the output schema", async () => {
    const tools = collectTools(baseConfig);

    const user = await tools.get("get_current_user")!.handler({});
    validateOutput(tools.get("get_current_user")!, user.structuredContent);
    expect(
      (user.structuredContent as { gitlab_instance: string }).gitlab_instance
    ).toBe("https://gitlab.com");

    const projects = await tools
      .get("search_projects")!
      .handler({ search: "x" });
    validateOutput(tools.get("search_projects")!, projects.structuredContent);
    const sc = projects.structuredContent as { items: unknown[] };
    expect(Array.isArray(sc.items)).toBe(true);

    const file = await tools
      .get("get_file")!
      .handler({ project_id: "1", file_path: "a.txt", ref: "main" });
    validateOutput(tools.get("get_file")!, file.structuredContent);
  });

  it("blocks write tools when GITLAB_ENABLE_WRITE_TOOLS is off", async () => {
    const tool = collectTools(baseConfig).get("create_issue")!;
    await expect(
      tool.handler({ project_id: "1", title: "bug" })
    ).rejects.toThrow("write tools are disabled");
  });

  it("allows write tools when enabled and satisfies the output schema", async () => {
    const tools = collectTools({ ...baseConfig, enableWriteTools: true });
    const issue = await tools
      .get("create_issue")!
      .handler({ project_id: "1", title: "bug" });
    validateOutput(tools.get("create_issue")!, issue.structuredContent);
    const merged = await tools
      .get("merge_merge_request")!
      .handler({ project_id: "1", merge_request_iid: 1 });
    validateOutput(tools.get("merge_merge_request")!, merged.structuredContent);
  });
});
