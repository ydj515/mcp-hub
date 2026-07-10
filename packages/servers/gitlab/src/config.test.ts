import { describe, expect, it } from "vitest";
import { loadGitLabConfig } from "./config.js";

describe("loadGitLabConfig", () => {
  it("loads GitLab.com defaults", () => {
    const config = loadGitLabConfig({ GITLAB_TOKEN: "token" });

    expect(config).toEqual({
      baseUrl: "https://gitlab.com",
      apiBaseUrl: "https://gitlab.com/api/v4",
      token: "token",
      authMode: "private-token",
      enableWriteTools: false,
      maxPerPage: 50,
      maxFileBytes: 1048576,
      timeoutMs: 10000
    });
  });

  it("enables write tools explicitly", () => {
    const config = loadGitLabConfig({
      GITLAB_TOKEN: "token",
      GITLAB_ENABLE_WRITE_TOOLS: "true"
    });

    expect(config.enableWriteTools).toBe(true);
  });

  it("supports self-hosted GitLab under a relative URL", () => {
    const config = loadGitLabConfig({
      GITLAB_TOKEN: "token",
      GITLAB_URL: "https://gitlab.example.com/gitlab/"
    });

    expect(config.baseUrl).toBe("https://gitlab.example.com/gitlab");
    expect(config.apiBaseUrl).toBe(
      "https://gitlab.example.com/gitlab/api/v4"
    );
  });

  it("accepts a full API base URL", () => {
    const config = loadGitLabConfig({
      GITLAB_TOKEN: "token",
      GITLAB_URL: "https://gitlab.example.com/api/v4"
    });

    expect(config.apiBaseUrl).toBe("https://gitlab.example.com/api/v4");
  });

  it("throws when GITLAB_TOKEN is missing", () => {
    expect(() => loadGitLabConfig({})).toThrow("GITLAB_TOKEN is required");
  });

  it("throws when GITLAB_AUTH_MODE is invalid", () => {
    expect(() =>
      loadGitLabConfig({
        GITLAB_TOKEN: "token",
        GITLAB_AUTH_MODE: "basic"
      })
    ).toThrow("GITLAB_AUTH_MODE must be private-token or bearer");
  });

  it("throws when GITLAB_MAX_PER_PAGE exceeds the GitLab API limit", () => {
    expect(() =>
      loadGitLabConfig({
        GITLAB_TOKEN: "token",
        GITLAB_MAX_PER_PAGE: "101"
      })
    ).toThrow("GITLAB_MAX_PER_PAGE must be less than or equal to 100");
  });
});
