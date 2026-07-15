import { describe, expect, it } from "vitest";
import { loadDockerConfig } from "./config.js";

describe("loadDockerConfig", () => {
  it("loads safe read-only defaults", () => {
    expect(loadDockerConfig({})).toEqual({
      enableWriteTools: false,
      allowedContainers: undefined,
      allowedNetworks: undefined,
      allowedVolumes: undefined,
      composeProjects: {},
      maxComposeContainers: 100,
      eventsLookbackMinutes: 15,
      maxEventLookbackMinutes: 60,
      maxLogLines: 500,
      maxOutputBytes: 1_048_576,
      commandTimeoutMs: 10_000
    });
  });

  it("loads explicit write access and container allowlist", () => {
    expect(
      loadDockerConfig({
        DOCKER_ENABLE_WRITE_TOOLS: "true",
        DOCKER_ALLOWED_CONTAINERS: "api, worker-1 ",
        DOCKER_ALLOWED_NETWORKS: "app-net",
        DOCKER_ALLOWED_VOLUMES: "app-data",
        DOCKER_COMPOSE_PROJECTS: '{"app":"/workspace/app"}',
        DOCKER_MAX_COMPOSE_CONTAINERS: "20",
        DOCKER_EVENTS_LOOKBACK_MINUTES: "5",
        DOCKER_MAX_EVENT_LOOKBACK_MINUTES: "30",
        DOCKER_MAX_LOG_LINES: "100",
        DOCKER_MAX_OUTPUT_BYTES: "2048",
        DOCKER_COMMAND_TIMEOUT_MS: "3000"
      })
    ).toEqual({
      enableWriteTools: true,
      allowedContainers: ["api", "worker-1"],
      allowedNetworks: ["app-net"],
      allowedVolumes: ["app-data"],
      composeProjects: { app: "/workspace/app" },
      maxComposeContainers: 20,
      eventsLookbackMinutes: 5,
      maxEventLookbackMinutes: 30,
      maxLogLines: 100,
      maxOutputBytes: 2048,
      commandTimeoutMs: 3000
    });
  });

  it("treats empty optional environment injections as defaults", () => {
    expect(
      loadDockerConfig({
        DOCKER_ENABLE_WRITE_TOOLS: "",
        DOCKER_ALLOWED_CONTAINERS: ""
      })
    ).toMatchObject({
      enableWriteTools: false,
      allowedContainers: undefined,
      allowedNetworks: undefined,
      allowedVolumes: undefined,
      composeProjects: {}
    });
  });

  it("rejects malformed boolean, limits, and empty allowlist", () => {
    expect(() =>
      loadDockerConfig({ DOCKER_ENABLE_WRITE_TOOLS: "yes" })
    ).toThrow("DOCKER_ENABLE_WRITE_TOOLS must be true or false");
    expect(() => loadDockerConfig({ DOCKER_MAX_LOG_LINES: "0" })).toThrow(
      "DOCKER_MAX_LOG_LINES must be a positive integer"
    );
    expect(() => loadDockerConfig({ DOCKER_ALLOWED_CONTAINERS: " , " })).toThrow(
      "DOCKER_ALLOWED_CONTAINERS must include at least one container"
    );
    expect(() =>
      loadDockerConfig({ DOCKER_COMPOSE_PROJECTS: "not-json" })
    ).toThrow("DOCKER_COMPOSE_PROJECTS must be a JSON object");
    expect(() =>
      loadDockerConfig({ DOCKER_COMPOSE_PROJECTS: '{"app":""}' })
    ).toThrow("DOCKER_COMPOSE_PROJECTS values must be non-empty directories");
    expect(() =>
      loadDockerConfig({
        DOCKER_EVENTS_LOOKBACK_MINUTES: "61",
        DOCKER_MAX_EVENT_LOOKBACK_MINUTES: "60"
      })
    ).toThrow(
      "DOCKER_EVENTS_LOOKBACK_MINUTES must not exceed DOCKER_MAX_EVENT_LOOKBACK_MINUTES"
    );
  });
});
