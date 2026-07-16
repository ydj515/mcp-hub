import { parseBooleanFlag, parseBoundedInt, parsePositiveInt } from "@mcp-hub/core";

export type GitLabAuthMode = "private-token" | "bearer";

export type GitLabConfig = {
  baseUrl: string;
  apiBaseUrl: string;
  token: string;
  authMode: GitLabAuthMode;
  enableWriteTools: boolean;
  maxPerPage: number;
  maxFileBytes: number;
  timeoutMs: number;
};

const normalizeGitLabUrl = (rawUrl: string) => {
  const url = new URL(rawUrl);
  url.hash = "";
  url.search = "";
  url.pathname = url.pathname.replace(/\/+$/, "");

  const baseUrl = url.toString().replace(/\/$/, "");
  const apiBaseUrl = baseUrl.endsWith("/api/v4")
    ? baseUrl
    : `${baseUrl}/api/v4`;

  return { baseUrl, apiBaseUrl };
};

const parseAuthMode = (value: string | undefined): GitLabAuthMode => {
  if (!value) {
    return "private-token";
  }
  if (value === "private-token" || value === "bearer") {
    return value;
  }
  throw new Error("GITLAB_AUTH_MODE must be private-token or bearer");
};

export const loadGitLabConfig = (env: NodeJS.ProcessEnv): GitLabConfig => {
  const token = env.GITLAB_TOKEN?.trim();
  if (!token) {
    throw new Error("GITLAB_TOKEN is required");
  }

  const { baseUrl, apiBaseUrl } = normalizeGitLabUrl(
    env.GITLAB_URL ?? "https://gitlab.com"
  );

  return {
    baseUrl,
    apiBaseUrl,
    token,
    authMode: parseAuthMode(env.GITLAB_AUTH_MODE),
    enableWriteTools: parseBooleanFlag(
      env.GITLAB_ENABLE_WRITE_TOOLS,
      "GITLAB_ENABLE_WRITE_TOOLS"
    ),
    maxPerPage: parseBoundedInt(
      env.GITLAB_MAX_PER_PAGE,
      50,
      "GITLAB_MAX_PER_PAGE",
      100
    ),
    maxFileBytes: parsePositiveInt(
      env.GITLAB_MAX_FILE_BYTES,
      1048576,
      "GITLAB_MAX_FILE_BYTES"
    ),
    timeoutMs: parsePositiveInt(env.GITLAB_TIMEOUT_MS, 10000, "GITLAB_TIMEOUT_MS")
  };
};
