import { assertFeatureEnabled } from "@mcp-hub/core";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { GitLabConfig } from "../config.js";
import type { GitLabClient } from "../services/gitlab.js";
import {
  approveMergeRequestParameters,
  createIssueNoteParameters,
  createIssueParameters,
  createMergeRequestNoteParameters,
  createMergeRequestParameters,
  getIssueParameters,
  getFileParameters,
  getMergeRequestParameters,
  getProjectParameters,
  getPipelineJobsParameters,
  listIssuesParameters,
  listCommitsParameters,
  listMergeRequestsParameters,
  listPipelinesParameters,
  listProjectBranchesParameters,
  mergeMergeRequestParameters,
  searchProjectsParameters,
  type ApproveMergeRequestParameters,
  type CreateIssueNoteParameters,
  type CreateIssueParameters,
  type CreateMergeRequestNoteParameters,
  type CreateMergeRequestParameters,
  type GetIssueParameters,
  type GetFileParameters,
  type GetMergeRequestParameters,
  type GetProjectParameters,
  type GetPipelineJobsParameters,
  type ListIssuesParameters,
  type ListCommitsParameters,
  type ListMergeRequestsParameters,
  type ListPipelinesParameters,
  type ListProjectBranchesParameters,
  type MergeMergeRequestParameters,
  type SearchProjectsParameters
} from "./schemas.js";

const jsonText = (value: unknown) => JSON.stringify(value, null, 2);

const result = (value: Record<string, unknown>) => ({
  content: [{ type: "text" as const, text: jsonText(value) }],
  structuredContent: value
});

const withInstance = (config: GitLabConfig, value: Record<string, unknown>) => ({
  gitlab_instance: config.baseUrl,
  ...value
});

type GitLabFilePayload = {
  content?: unknown;
  encoding?: unknown;
  size?: unknown;
  [key: string]: unknown;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const prepareFilePayload = (
  file: unknown,
  config: GitLabConfig,
  includeBase64: boolean | undefined
) => {
  if (!isRecord(file)) {
    return file;
  }

  const prepared: GitLabFilePayload = { ...file };
  const content =
    typeof prepared.content === "string" ? prepared.content : undefined;
  const encoding =
    typeof prepared.encoding === "string" ? prepared.encoding : undefined;

  if (!includeBase64) {
    delete prepared.content;
  }

  if (content && encoding === "base64") {
    const decoded = Buffer.from(content, "base64");
    if (decoded.byteLength <= config.maxFileBytes) {
      prepared.decoded_content = decoded.toString("utf8");
    } else {
      prepared.content_omitted = true;
      prepared.content_omitted_reason = `Decoded file exceeds GITLAB_MAX_FILE_BYTES (${config.maxFileBytes}).`;
    }
  }

  return prepared;
};

const assertWriteEnabled = (config: GitLabConfig) =>
  assertFeatureEnabled(
    config.enableWriteTools,
    "GitLab write tools are disabled. Set GITLAB_ENABLE_WRITE_TOOLS=true to enable create/comment/approve/merge tools."
  );

export const registerGitLabTools = (
  server: McpServer,
  client: GitLabClient,
  config: GitLabConfig
) => {
  server.registerTool(
    "get_current_user",
    {
      title: "Get Current GitLab User",
      description:
        "Return the authenticated GitLab user for the configured GitLab instance.",
      inputSchema: {}
    },
    async () => {
      const user = await client.getCurrentUser();
      return result(withInstance(config, { user }));
    }
  );

  server.registerTool(
    "search_projects",
    {
      title: "Search GitLab Projects",
      description:
        "Search GitLab projects on GitLab.com or a configured self-hosted GitLab instance.",
      inputSchema: searchProjectsParameters.shape
    },
    async (params: SearchProjectsParameters) => {
      const projects = await client.searchProjects(params);
      return result(withInstance(config, projects));
    }
  );

  server.registerTool(
    "get_project",
    {
      title: "Get GitLab Project",
      description:
        "Fetch a GitLab project by numeric ID or namespaced path like group/project.",
      inputSchema: getProjectParameters.shape
    },
    async ({ project_id }: GetProjectParameters) => {
      const project = await client.getProject(project_id);
      return result(withInstance(config, { project }));
    }
  );

  server.registerTool(
    "list_issues",
    {
      title: "List GitLab Issues",
      description:
        "List issues for a GitLab project with state, labels, search, author, and assignee filters.",
      inputSchema: listIssuesParameters.shape
    },
    async (params: ListIssuesParameters) => {
      const issues = await client.listIssues(params);
      return result(withInstance(config, issues));
    }
  );

  server.registerTool(
    "get_issue",
    {
      title: "Get GitLab Issue",
      description:
        "Fetch a single GitLab project issue by project ID/path and issue IID.",
      inputSchema: getIssueParameters.shape
    },
    async ({ project_id, issue_iid }: GetIssueParameters) => {
      const issue = await client.getIssue(project_id, issue_iid);
      return result(withInstance(config, { issue }));
    }
  );

  server.registerTool(
    "list_merge_requests",
    {
      title: "List GitLab Merge Requests",
      description:
        "List merge requests for a GitLab project with state, labels, search, branch, author, and reviewer filters.",
      inputSchema: listMergeRequestsParameters.shape
    },
    async (params: ListMergeRequestsParameters) => {
      const merge_requests = await client.listMergeRequests(params);
      return result(withInstance(config, merge_requests));
    }
  );

  server.registerTool(
    "get_merge_request",
    {
      title: "Get GitLab Merge Request",
      description:
        "Fetch a single GitLab project merge request by project ID/path and merge request IID.",
      inputSchema: getMergeRequestParameters.shape
    },
    async ({
      project_id,
      merge_request_iid
    }: GetMergeRequestParameters) => {
      const merge_request = await client.getMergeRequest(
        project_id,
        merge_request_iid
      );
      return result(withInstance(config, { merge_request }));
    }
  );

  server.registerTool(
    "list_project_branches",
    {
      title: "List GitLab Project Branches",
      description:
        "List repository branches for a GitLab project with search or regex filtering.",
      inputSchema: listProjectBranchesParameters.shape
    },
    async (params: ListProjectBranchesParameters) => {
      const branches = await client.listProjectBranches(params);
      return result(withInstance(config, branches));
    }
  );

  server.registerTool(
    "list_commits",
    {
      title: "List GitLab Commits",
      description:
        "List repository commits for a GitLab project, optionally filtered by ref, path, author, and date range.",
      inputSchema: listCommitsParameters.shape
    },
    async (params: ListCommitsParameters) => {
      const commits = await client.listCommits(params);
      return result(withInstance(config, commits));
    }
  );

  server.registerTool(
    "get_file",
    {
      title: "Get GitLab Repository File",
      description:
        "Fetch a repository file by project, path, and ref. Base64 content is hidden by default and decoded text is returned when under the configured size limit.",
      inputSchema: getFileParameters.shape
    },
    async (params: GetFileParameters) => {
      const file = await client.getFile(params);
      return result(
        withInstance(config, {
          file: prepareFilePayload(file, config, params.include_base64)
        })
      );
    }
  );

  server.registerTool(
    "list_pipelines",
    {
      title: "List GitLab Pipelines",
      description:
        "List CI/CD pipelines for a GitLab project with ref, status, source, and updated date filters.",
      inputSchema: listPipelinesParameters.shape
    },
    async (params: ListPipelinesParameters) => {
      const pipelines = await client.listPipelines(params);
      return result(withInstance(config, pipelines));
    }
  );

  server.registerTool(
    "get_pipeline_jobs",
    {
      title: "Get GitLab Pipeline Jobs",
      description:
        "List jobs for a GitLab pipeline, optionally including retried jobs and filtering by job status.",
      inputSchema: getPipelineJobsParameters.shape
    },
    async (params: GetPipelineJobsParameters) => {
      const jobs = await client.getPipelineJobs(params);
      return result(withInstance(config, jobs));
    }
  );

  server.registerTool(
    "create_issue",
    {
      title: "Create GitLab Issue",
      description:
        "Create a GitLab issue. Requires GITLAB_ENABLE_WRITE_TOOLS=true.",
      inputSchema: createIssueParameters.shape
    },
    async (params: CreateIssueParameters) => {
      assertWriteEnabled(config);
      const issue = await client.createIssue(params);
      return result(withInstance(config, { issue }));
    }
  );

  server.registerTool(
    "create_merge_request",
    {
      title: "Create GitLab Merge Request",
      description:
        "Create a GitLab merge request. Requires GITLAB_ENABLE_WRITE_TOOLS=true.",
      inputSchema: createMergeRequestParameters.shape
    },
    async (params: CreateMergeRequestParameters) => {
      assertWriteEnabled(config);
      const merge_request = await client.createMergeRequest(params);
      return result(withInstance(config, { merge_request }));
    }
  );

  server.registerTool(
    "create_issue_note",
    {
      title: "Create GitLab Issue Note",
      description:
        "Create a comment on a GitLab issue. Requires GITLAB_ENABLE_WRITE_TOOLS=true.",
      inputSchema: createIssueNoteParameters.shape
    },
    async (params: CreateIssueNoteParameters) => {
      assertWriteEnabled(config);
      const note = await client.createIssueNote(params);
      return result(withInstance(config, { note }));
    }
  );

  server.registerTool(
    "create_merge_request_note",
    {
      title: "Create GitLab Merge Request Note",
      description:
        "Create a comment on a GitLab merge request. Requires GITLAB_ENABLE_WRITE_TOOLS=true.",
      inputSchema: createMergeRequestNoteParameters.shape
    },
    async (params: CreateMergeRequestNoteParameters) => {
      assertWriteEnabled(config);
      const note = await client.createMergeRequestNote(params);
      return result(withInstance(config, { note }));
    }
  );

  server.registerTool(
    "approve_merge_request",
    {
      title: "Approve GitLab Merge Request",
      description:
        "Approve a GitLab merge request as the authenticated user. Requires GITLAB_ENABLE_WRITE_TOOLS=true.",
      inputSchema: approveMergeRequestParameters.shape
    },
    async (params: ApproveMergeRequestParameters) => {
      assertWriteEnabled(config);
      const merge_request = await client.approveMergeRequest(params);
      return result(withInstance(config, { merge_request }));
    }
  );

  server.registerTool(
    "merge_merge_request",
    {
      title: "Merge GitLab Merge Request",
      description:
        "Merge a GitLab merge request. Requires GITLAB_ENABLE_WRITE_TOOLS=true.",
      inputSchema: mergeMergeRequestParameters.shape
    },
    async (params: MergeMergeRequestParameters) => {
      assertWriteEnabled(config);
      const merge_request = await client.mergeMergeRequest(params);
      return result(withInstance(config, { merge_request }));
    }
  );
};
