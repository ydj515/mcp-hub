import { describe, expect, it } from "vitest";
import type { GitLabConfig } from "../config.js";
import { createGitLabClient } from "./gitlab.js";

const config: GitLabConfig = {
  baseUrl: "https://gitlab.example.com/gitlab",
  apiBaseUrl: "https://gitlab.example.com/gitlab/api/v4",
  token: "secret",
  authMode: "private-token",
  enableWriteTools: false,
  maxPerPage: 50,
  maxFileBytes: 1048576,
  timeoutMs: 10000
};

describe("createGitLabClient", () => {
  it("uses self-hosted base URL and PRIVATE-TOKEN auth", async () => {
    const requests: Array<{ url: string; token: string | null }> = [];
    const client = createGitLabClient(config, async (input, init) => {
      const headers = new Headers(init?.headers);
      requests.push({
        url: String(input),
        token: headers.get("PRIVATE-TOKEN")
      });
      return new Response(JSON.stringify([{ id: 1 }]), {
        headers: {
          "content-type": "application/json",
          "x-next-page": "2"
        }
      });
    });

    const result = await client.searchProjects({
      search: "mcp",
      membership: true
    });

    expect(requests).toEqual([
      {
        url: "https://gitlab.example.com/gitlab/api/v4/projects?search=mcp&membership=true&simple=true&per_page=50",
        token: "secret"
      }
    ]);
    expect(result.items).toEqual([{ id: 1 }]);
    expect(result.pagination.next_page).toBe("2");
  });

  it("URL-encodes namespaced project paths", async () => {
    const urls: string[] = [];
    const client = createGitLabClient(config, async (input) => {
      urls.push(String(input));
      return new Response(JSON.stringify({ id: 1 }));
    });

    await client.getProject("group/subgroup/project");

    expect(urls).toEqual([
      "https://gitlab.example.com/gitlab/api/v4/projects/group%2Fsubgroup%2Fproject"
    ]);
  });

  it("URL-encodes repository file paths", async () => {
    const urls: string[] = [];
    const client = createGitLabClient(config, async (input) => {
      urls.push(String(input));
      return new Response(JSON.stringify({ file_path: "src/index.ts" }));
    });

    await client.getFile({
      project_id: "group/project",
      file_path: "src/index.ts",
      ref: "main"
    });

    expect(urls).toEqual([
      "https://gitlab.example.com/gitlab/api/v4/projects/group%2Fproject/repository/files/src%2Findex.ts?ref=main"
    ]);
  });

  it("appends array query parameters for pipeline jobs", async () => {
    const urls: string[] = [];
    const client = createGitLabClient(config, async (input) => {
      urls.push(String(input));
      return new Response(JSON.stringify([]));
    });

    await client.getPipelineJobs({
      project_id: 1,
      pipeline_id: 2,
      scope: ["pending", "running"],
      include_retried: true
    });

    expect(urls).toEqual([
      "https://gitlab.example.com/gitlab/api/v4/projects/1/pipelines/2/jobs?include_retried=true&scope%5B%5D=pending&scope%5B%5D=running&per_page=50"
    ]);
  });

  it("sends JSON bodies for write requests", async () => {
    const requests: Array<{ method: string | undefined; body: unknown }> = [];
    const client = createGitLabClient(config, async (_input, init) => {
      requests.push({
        method: init?.method,
        body: JSON.parse(String(init?.body))
      });
      return new Response(JSON.stringify({ iid: 1 }));
    });

    await client.createIssue({
      project_id: "group/project",
      title: "Fix docs",
      labels: "docs"
    });

    expect(requests).toEqual([
      {
        method: "POST",
        body: {
          title: "Fix docs",
          labels: "docs"
        }
      }
    ]);
  });

  it("uses PUT when merging merge requests", async () => {
    const methods: Array<string | undefined> = [];
    const client = createGitLabClient(config, async (_input, init) => {
      methods.push(init?.method);
      return new Response(JSON.stringify({ iid: 1, state: "merged" }));
    });

    await client.mergeMergeRequest({
      project_id: 1,
      merge_request_iid: 2,
      sha: "abc"
    });

    expect(methods).toEqual(["PUT"]);
  });

  it("supports bearer auth", async () => {
    const headersSeen: string[] = [];
    const client = createGitLabClient(
      { ...config, authMode: "bearer" },
      async (_input, init) => {
        const headers = new Headers(init?.headers);
        headersSeen.push(headers.get("Authorization") ?? "");
        return new Response(JSON.stringify({ id: 1 }));
      }
    );

    await client.getCurrentUser();

    expect(headersSeen).toEqual(["Bearer secret"]);
  });

  it("throws GitLab API error messages", async () => {
    const client = createGitLabClient(config, async () =>
      new Response(JSON.stringify({ message: "401 Unauthorized" }), {
        status: 401,
        statusText: "Unauthorized"
      })
    );

    await expect(client.getCurrentUser()).rejects.toThrow(
      "GitLab API request failed (401 Unauthorized): 401 Unauthorized"
    );
  });
});
