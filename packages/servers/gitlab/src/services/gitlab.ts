import type { GitLabConfig } from "../config.js";

export type GitLabProjectId = string | number;

export type GitLabPagination = {
  page: string | null;
  per_page: string | null;
  next_page: string | null;
  prev_page: string | null;
  total: string | null;
  total_pages: string | null;
};

export type GitLabListResult<T> = {
  items: T;
  pagination: GitLabPagination;
};

type GitLabQueryValue =
  | Array<number | string>
  | boolean
  | number
  | string
  | undefined;

type GitLabRequestBody =
  | Array<unknown>
  | Record<string, unknown>
  | undefined;

type GitLabRequestOptions = {
  method?: "GET" | "POST" | "PUT";
  query?: Record<string, GitLabQueryValue>;
  body?: GitLabRequestBody;
};

type FetchLike = (
  input: string | URL,
  init?: RequestInit
) => Promise<Response>;

const appendQuery = (url: URL, query: Record<string, GitLabQueryValue>) => {
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === "") {
      continue;
    }
    if (Array.isArray(value)) {
      if (!value.length) {
        continue;
      }
      for (const item of value) {
        url.searchParams.append(key, String(item));
      }
      continue;
    }
    url.searchParams.set(key, String(value));
  }
};

const encodeProjectId = (projectId: GitLabProjectId) =>
  encodeURIComponent(String(projectId));

const encodeFilePath = (filePath: string) => encodeURIComponent(filePath);

const paginationFromHeaders = (headers: Headers): GitLabPagination => ({
  page: headers.get("x-page"),
  per_page: headers.get("x-per-page"),
  next_page: headers.get("x-next-page"),
  prev_page: headers.get("x-prev-page"),
  total: headers.get("x-total"),
  total_pages: headers.get("x-total-pages")
});

const normalizePerPage = (
  perPage: number | undefined,
  maxPerPage: number
) => Math.min(perPage ?? maxPerPage, maxPerPage);

const jsonMessage = (value: unknown) => {
  if (typeof value === "object" && value !== null && "message" in value) {
    return String((value as { message: unknown }).message);
  }
  if (typeof value === "string") {
    return value;
  }
  return JSON.stringify(value);
};

export const createGitLabClient = (
  config: GitLabConfig,
  fetchFn: FetchLike = fetch
) => {
  const request = async <T>(
    path: string,
    options: GitLabRequestOptions = {}
  ) => {
    const url = new URL(`${config.apiBaseUrl}${path}`);
    appendQuery(url, options.query ?? {});

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

    const headers = new Headers({ Accept: "application/json" });
    if (config.authMode === "bearer") {
      headers.set("Authorization", `Bearer ${config.token}`);
    } else {
      headers.set("PRIVATE-TOKEN", config.token);
    }

    const requestBody =
      options.body === undefined ? undefined : JSON.stringify(options.body);
    if (requestBody) {
      headers.set("Content-Type", "application/json");
    }

    try {
      const response = await fetchFn(url, {
        method: options.method ?? "GET",
        headers,
        body: requestBody,
        signal: controller.signal
      });
      const text = await response.text();
      const responseBody = text ? (JSON.parse(text) as unknown) : undefined;

      if (!response.ok) {
        throw new Error(
          `GitLab API request failed (${response.status} ${response.statusText}): ${jsonMessage(responseBody)}`
        );
      }

      return {
        data: responseBody as T,
        pagination: paginationFromHeaders(response.headers)
      };
    } finally {
      clearTimeout(timeout);
    }
  };

  return {
    getCurrentUser: async () => {
      const { data } = await request<unknown>("/user");
      return data;
    },
    searchProjects: async (params: {
      search?: string;
      membership?: boolean;
      owned?: boolean;
      simple?: boolean;
      order_by?: string;
      sort?: string;
      page?: number;
      per_page?: number;
    }): Promise<GitLabListResult<unknown>> => {
      const { data, pagination } = await request<unknown[]>("/projects", {
        query: {
          search: params.search,
          membership: params.membership,
          owned: params.owned,
          simple: params.simple ?? true,
          order_by: params.order_by,
          sort: params.sort,
          page: params.page,
          per_page: normalizePerPage(params.per_page, config.maxPerPage)
        }
      });
      return { items: data, pagination };
    },
    getProject: async (projectId: GitLabProjectId) => {
      const { data } = await request<unknown>(
        `/projects/${encodeProjectId(projectId)}`
      );
      return data;
    },
    listIssues: async (params: {
      project_id: GitLabProjectId;
      state?: string;
      search?: string;
      labels?: string;
      scope?: string;
      assignee_username?: string;
      author_username?: string;
      page?: number;
      per_page?: number;
    }): Promise<GitLabListResult<unknown>> => {
      const { data, pagination } = await request<unknown[]>(
        `/projects/${encodeProjectId(params.project_id)}/issues`,
        {
          query: {
            state: params.state,
            search: params.search,
            labels: params.labels,
            scope: params.scope,
            assignee_username: params.assignee_username,
            author_username: params.author_username,
            page: params.page,
            per_page: normalizePerPage(params.per_page, config.maxPerPage)
          }
        }
      );
      return { items: data, pagination };
    },
    getIssue: async (projectId: GitLabProjectId, issueIid: number) => {
      const { data } = await request<unknown>(
        `/projects/${encodeProjectId(projectId)}/issues/${issueIid}`
      );
      return data;
    },
    listMergeRequests: async (params: {
      project_id: GitLabProjectId;
      state?: string;
      search?: string;
      labels?: string;
      scope?: string;
      author_username?: string;
      reviewer_username?: string;
      source_branch?: string;
      target_branch?: string;
      page?: number;
      per_page?: number;
    }): Promise<GitLabListResult<unknown>> => {
      const { data, pagination } = await request<unknown[]>(
        `/projects/${encodeProjectId(params.project_id)}/merge_requests`,
        {
          query: {
            state: params.state,
            search: params.search,
            labels: params.labels,
            scope: params.scope,
            author_username: params.author_username,
            reviewer_username: params.reviewer_username,
            source_branch: params.source_branch,
            target_branch: params.target_branch,
            page: params.page,
            per_page: normalizePerPage(params.per_page, config.maxPerPage)
          }
        }
      );
      return { items: data, pagination };
    },
    getMergeRequest: async (
      projectId: GitLabProjectId,
      mergeRequestIid: number
    ) => {
      const { data } = await request<unknown>(
        `/projects/${encodeProjectId(projectId)}/merge_requests/${mergeRequestIid}`
      );
      return data;
    },
    listProjectBranches: async (params: {
      project_id: GitLabProjectId;
      search?: string;
      regex?: string;
      page?: number;
      per_page?: number;
    }): Promise<GitLabListResult<unknown>> => {
      const { data, pagination } = await request<unknown[]>(
        `/projects/${encodeProjectId(params.project_id)}/repository/branches`,
        {
          query: {
            search: params.search,
            regex: params.regex,
            page: params.page,
            per_page: normalizePerPage(params.per_page, config.maxPerPage)
          }
        }
      );
      return { items: data, pagination };
    },
    listCommits: async (params: {
      project_id: GitLabProjectId;
      ref_name?: string;
      path?: string;
      author?: string;
      since?: string;
      until?: string;
      all?: boolean;
      first_parent?: boolean;
      trailers?: boolean;
      with_stats?: boolean;
      order?: string;
      page?: number;
      per_page?: number;
    }): Promise<GitLabListResult<unknown>> => {
      const { data, pagination } = await request<unknown[]>(
        `/projects/${encodeProjectId(params.project_id)}/repository/commits`,
        {
          query: {
            ref_name: params.ref_name,
            path: params.path,
            author: params.author,
            since: params.since,
            until: params.until,
            all: params.all,
            first_parent: params.first_parent,
            trailers: params.trailers,
            with_stats: params.with_stats,
            order: params.order,
            page: params.page,
            per_page: normalizePerPage(params.per_page, config.maxPerPage)
          }
        }
      );
      return { items: data, pagination };
    },
    getFile: async (params: {
      project_id: GitLabProjectId;
      file_path: string;
      ref: string;
    }) => {
      const { data } = await request<unknown>(
        `/projects/${encodeProjectId(params.project_id)}/repository/files/${encodeFilePath(params.file_path)}`,
        { query: { ref: params.ref } }
      );
      return data;
    },
    listPipelines: async (params: {
      project_id: GitLabProjectId;
      ref?: string;
      sha?: string;
      status?: string;
      source?: string;
      scope?: string;
      name?: string;
      username?: string;
      updated_after?: string;
      updated_before?: string;
      order_by?: string;
      sort?: string;
      page?: number;
      per_page?: number;
    }): Promise<GitLabListResult<unknown>> => {
      const { data, pagination } = await request<unknown[]>(
        `/projects/${encodeProjectId(params.project_id)}/pipelines`,
        {
          query: {
            ref: params.ref,
            sha: params.sha,
            status: params.status,
            source: params.source,
            scope: params.scope,
            name: params.name,
            username: params.username,
            updated_after: params.updated_after,
            updated_before: params.updated_before,
            order_by: params.order_by,
            sort: params.sort,
            page: params.page,
            per_page: normalizePerPage(params.per_page, config.maxPerPage)
          }
        }
      );
      return { items: data, pagination };
    },
    getPipelineJobs: async (params: {
      project_id: GitLabProjectId;
      pipeline_id: number;
      include_retried?: boolean;
      scope?: string[];
      page?: number;
      per_page?: number;
    }): Promise<GitLabListResult<unknown>> => {
      const { data, pagination } = await request<unknown[]>(
        `/projects/${encodeProjectId(params.project_id)}/pipelines/${params.pipeline_id}/jobs`,
        {
          query: {
            include_retried: params.include_retried,
            "scope[]": params.scope,
            page: params.page,
            per_page: normalizePerPage(params.per_page, config.maxPerPage)
          }
        }
      );
      return { items: data, pagination };
    },
    createIssue: async (params: {
      project_id: GitLabProjectId;
      title: string;
      description?: string;
      assignee_ids?: number[];
      confidential?: boolean;
      due_date?: string;
      issue_type?: string;
      labels?: string;
      milestone_id?: number;
      weight?: number;
    }) => {
      const { project_id, ...body } = params;
      const { data } = await request<unknown>(
        `/projects/${encodeProjectId(project_id)}/issues`,
        { method: "POST", body }
      );
      return data;
    },
    createMergeRequest: async (params: {
      project_id: GitLabProjectId;
      source_branch: string;
      target_branch: string;
      title: string;
      description?: string;
      assignee_ids?: number[];
      reviewer_ids?: number[];
      labels?: string;
      milestone_id?: number;
      remove_source_branch?: boolean;
      squash?: boolean;
      allow_collaboration?: boolean;
      target_project_id?: number;
    }) => {
      const { project_id, ...body } = params;
      const { data } = await request<unknown>(
        `/projects/${encodeProjectId(project_id)}/merge_requests`,
        { method: "POST", body }
      );
      return data;
    },
    createIssueNote: async (params: {
      project_id: GitLabProjectId;
      issue_iid: number;
      body: string;
      internal?: boolean;
    }) => {
      const { project_id, issue_iid, ...body } = params;
      const { data } = await request<unknown>(
        `/projects/${encodeProjectId(project_id)}/issues/${issue_iid}/notes`,
        { method: "POST", body }
      );
      return data;
    },
    createMergeRequestNote: async (params: {
      project_id: GitLabProjectId;
      merge_request_iid: number;
      body: string;
      internal?: boolean;
      merge_request_diff_head_sha?: string;
    }) => {
      const { project_id, merge_request_iid, ...body } = params;
      const { data } = await request<unknown>(
        `/projects/${encodeProjectId(project_id)}/merge_requests/${merge_request_iid}/notes`,
        { method: "POST", body }
      );
      return data;
    },
    approveMergeRequest: async (params: {
      project_id: GitLabProjectId;
      merge_request_iid: number;
      sha?: string;
      approval_password?: string;
    }) => {
      const { project_id, merge_request_iid, ...body } = params;
      const { data } = await request<unknown>(
        `/projects/${encodeProjectId(project_id)}/merge_requests/${merge_request_iid}/approve`,
        { method: "POST", body }
      );
      return data;
    },
    mergeMergeRequest: async (params: {
      project_id: GitLabProjectId;
      merge_request_iid: number;
      sha?: string;
      auto_merge?: boolean;
      merge_commit_message?: string;
      squash_commit_message?: string;
      should_remove_source_branch?: boolean;
      squash?: boolean;
    }) => {
      const { project_id, merge_request_iid, ...body } = params;
      const { data } = await request<unknown>(
        `/projects/${encodeProjectId(project_id)}/merge_requests/${merge_request_iid}/merge`,
        { method: "PUT", body }
      );
      return data;
    }
  };
};

export type GitLabClient = ReturnType<typeof createGitLabClient>;
