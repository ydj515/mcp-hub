import { describe, expect, it, vi } from "vitest";
import type { DockerConfig } from "../config.js";
import {
  createDockerService,
  type DockerCommandRunner
} from "./docker-client.js";

const config: DockerConfig = {
  enableWriteTools: false,
  allowedContainers: undefined,
  allowedNetworks: undefined,
  allowedVolumes: undefined,
  composeProjects: { app: "/workspace/app" },
  maxComposeContainers: 100,
  eventsLookbackMinutes: 15,
  maxEventLookbackMinutes: 60,
  maxLogLines: 500,
  maxOutputBytes: 1_048_576,
  commandTimeoutMs: 10_000
};

const createRunner = () =>
  vi.fn<DockerCommandRunner>().mockImplementation(async (args) => {
    if (args[0] === "info") {
      return { stdout: '{"ServerVersion":"29.4.0"}', stderr: "" };
    }
    if (args[0] === "version") {
      return { stdout: '{"Client":{"Version":"29.4.0"}}', stderr: "" };
    }
    if (args[0] === "container" && args[1] === "ls") {
      return {
        stdout: '{"ID":"abc","Names":"api"}\n{"ID":"def","Names":"worker"}\n',
        stderr: ""
      };
    }
    if (
      args[0] === "container" &&
      args[1] === "inspect" &&
      args.includes("--format")
    ) {
      return { stdout: '{"Status":"healthy"}', stderr: "" };
    }
    if (args[0] === "container" && args[1] === "inspect") {
      return { stdout: '[{"Id":"abc","Name":"/api"}]', stderr: "" };
    }
    if (args[0] === "container" && args[1] === "logs") {
      return { stdout: "started\n", stderr: "warning\n" };
    }
    if (args[0] === "image") {
      return { stdout: '{"ID":"sha256:abc","Repository":"api"}\n', stderr: "" };
    }
    if (args[0] === "container" && args[1] === "stats") {
      return {
        stdout: '{"Name":"api","CPUPerc":"0.20%"}\n',
        stderr: ""
      };
    }
    if (args[0] === "network" && args[1] === "ls") {
      return { stdout: '{"ID":"net-id","Name":"app-net"}\n', stderr: "" };
    }
    if (args[0] === "network" && args[1] === "inspect") {
      return { stdout: '[{"Id":"net-id","Name":"app-net"}]', stderr: "" };
    }
    if (args[0] === "volume" && args[1] === "ls") {
      return { stdout: '{"Name":"app-data","Driver":"local"}\n', stderr: "" };
    }
    if (args[0] === "volume" && args[1] === "inspect") {
      return { stdout: '[{"Name":"app-data","Driver":"local"}]', stderr: "" };
    }
    if (args[0] === "compose" && args.includes("ls")) {
      return { stdout: '[{"Name":"app","Status":"running(2)"}]', stderr: "" };
    }
    if (args[0] === "compose" && args.includes("ps")) {
      return {
        stdout: '[{"ID":"container-id","Name":"app-api-1","Service":"api","State":"running"}]',
        stderr: ""
      };
    }
    if (args[0] === "compose" && args.includes("logs")) {
      return { stdout: "api started\n", stderr: "" };
    }
    if (args[0] === "compose" && args.includes("stats")) {
      return {
        stdout: '[{"Name":"app-api-1","CPUPerc":"0.10%","MemUsage":"10MiB / 1GiB"}]',
        stderr: ""
      };
    }
    if (args[0] === "compose" && args.includes("config")) {
      return {
        stdout: '{"name":"app","services":{"api":{"depends_on":{"db":{"condition":"service_healthy"}}},"db":{}}}',
        stderr: ""
      };
    }
    if (args[0] === "compose" && args.includes("events")) {
      return {
        stdout: '{"type":"container","action":"start"}\n{"type":"container","action":"health_status: healthy"}\n',
        stderr: ""
      };
    }
    if (args[0] === "compose" && args.includes("port")) {
      return { stdout: "0.0.0.0:8080\n", stderr: "" };
    }
    if (args[0] === "compose" && args.includes("top")) {
      return { stdout: "PID  COMMAND\n123  node server.js\n", stderr: "" };
    }
    if (args[0] === "compose" && args.includes("images")) {
      return { stdout: '[{"Container":"app-api-1","Repository":"api","Tag":"latest"}]', stderr: "" };
    }
    return { stdout: "api\n", stderr: "" };
  });

describe("createDockerService", () => {
  it("uses structured Docker CLI commands for read tools", async () => {
    const runner = createRunner();
    const docker = createDockerService(config, runner);

    await expect(docker.getDockerInfo()).resolves.toEqual({
      info: { ServerVersion: "29.4.0" },
      version: { Client: { Version: "29.4.0" } }
    });
    await expect(docker.listContainers(true)).resolves.toEqual({
      containers: [
        { ID: "abc", Names: "api" },
        { ID: "def", Names: "worker" }
      ]
    });
    await expect(docker.inspectContainer("api")).resolves.toEqual({
      container: { Id: "abc", Name: "/api" }
    });
    await expect(docker.getContainerLogs("api", 20)).resolves.toEqual({
      logs: "started\nwarning\n"
    });
    await expect(docker.listImages()).resolves.toEqual({
      images: [{ ID: "sha256:abc", Repository: "api" }]
    });
    await expect(docker.listComposeProjects()).resolves.toEqual({
      projects: [{ Name: "app", Status: "running(2)" }]
    });

    expect(runner).toHaveBeenNthCalledWith(1, ["info", "--format", "{{json .}}"]);
    expect(runner).toHaveBeenNthCalledWith(2, ["version", "--format", "{{json .}}"]);
    expect(runner).toHaveBeenNthCalledWith(3, [
      "container",
      "ls",
      "--all",
      "--format",
      "{{json .}}"
    ]);
    expect(runner).toHaveBeenNthCalledWith(4, ["container", "inspect", "api"]);
    expect(runner).toHaveBeenNthCalledWith(5, ["container", "logs", "--tail", "20", "api"]);
    expect(runner).toHaveBeenNthCalledWith(6, ["image", "ls", "--format", "{{json .}}"]);
    expect(runner).toHaveBeenNthCalledWith(7, ["compose", "ls", "--format", "json"]);
  });

  it("blocks write and execution tools unless explicitly enabled", async () => {
    const runner = createRunner();
    const docker = createDockerService(config, runner);

    await expect(docker.startContainer("api")).rejects.toThrow(
      "DOCKER_ENABLE_WRITE_TOOLS=true is required"
    );
    await expect(docker.restartContainer("api")).rejects.toThrow(
      "DOCKER_ENABLE_WRITE_TOOLS=true is required"
    );
    await expect(docker.execContainer("api", ["printenv"])).rejects.toThrow(
      "DOCKER_ENABLE_WRITE_TOOLS=true is required"
    );
    expect(runner).not.toHaveBeenCalled();
  });

  it("executes enabled commands as Docker argv without a shell", async () => {
    const runner = createRunner();
    const docker = createDockerService({ ...config, enableWriteTools: true }, runner);

    await expect(docker.startContainer("api")).resolves.toEqual({
      container: "api",
      output: "api\n"
    });
    await expect(docker.restartContainer("api")).resolves.toEqual({
      container: "api",
      output: "api\n"
    });
    await expect(
      docker.execContainer("api", ["sh", "-c", "echo $HOME"])
    ).resolves.toEqual({ stdout: "api\n", stderr: "" });

    expect(runner).toHaveBeenNthCalledWith(1, ["container", "start", "api"]);
    expect(runner).toHaveBeenNthCalledWith(2, ["container", "restart", "api"]);
    expect(runner).toHaveBeenNthCalledWith(3, [
      "container",
      "exec",
      "api",
      "sh",
      "-c",
      "echo $HOME"
    ]);
  });

  it("enforces the configured container allowlist for target tools", async () => {
    const runner = createRunner();
    const docker = createDockerService(
      { ...config, allowedContainers: ["api"] },
      runner
    );

    await expect(docker.inspectContainer("worker")).rejects.toThrow(
      "Container is not allowed by DOCKER_ALLOWED_CONTAINERS"
    );
    await expect(docker.getContainerLogs("worker", 10)).rejects.toThrow(
      "Container is not allowed by DOCKER_ALLOWED_CONTAINERS"
    );
    expect(runner).not.toHaveBeenCalled();
  });

  it("uses configured Compose project directories for project-scoped reads", async () => {
    const runner = createRunner();
    const docker = createDockerService(config, runner);

    await expect(docker.listComposeServices("app", ["api"])).resolves.toEqual({
      project: "app",
      services: [
        {
          ID: "container-id",
          Name: "app-api-1",
          Service: "api",
          State: "running"
        }
      ]
    });
    await expect(docker.getComposeLogs("app", "api", 20)).resolves.toEqual({
      project: "app",
      logs: "api started\n"
    });

    expect(runner).toHaveBeenNthCalledWith(1, [
      "compose",
      "--project-name",
      "app",
      "--project-directory",
      "/workspace/app",
      "ps",
      "--all",
      "--format",
      "json",
      "api"
    ]);
    expect(runner).toHaveBeenNthCalledWith(2, [
      "compose",
      "--project-name",
      "app",
      "--project-directory",
      "/workspace/app",
      "logs",
      "--no-color",
      "--tail",
      "20",
      "api"
    ]);
  });

  it("gates Compose lifecycle and execution tools behind the write flag", async () => {
    const runner = createRunner();
    const docker = createDockerService(config, runner);

    await expect(docker.upComposeProject("app", [])).rejects.toThrow(
      "DOCKER_ENABLE_WRITE_TOOLS=true is required"
    );
    await expect(docker.downComposeProject("app", false)).rejects.toThrow(
      "DOCKER_ENABLE_WRITE_TOOLS=true is required"
    );
    await expect(docker.restartComposeServices("app", ["api"])).rejects.toThrow(
      "DOCKER_ENABLE_WRITE_TOOLS=true is required"
    );
    await expect(
      docker.execComposeService("app", "api", ["printenv"])
    ).rejects.toThrow("DOCKER_ENABLE_WRITE_TOOLS=true is required");
    expect(runner).not.toHaveBeenCalled();
  });

  it("runs enabled Compose lifecycle and exec commands without volume deletion", async () => {
    const runner = createRunner();
    const docker = createDockerService({ ...config, enableWriteTools: true }, runner);

    await docker.upComposeProject("app", ["api"]);
    await docker.downComposeProject("app", true);
    await docker.restartComposeServices("app", ["api"]);
    await docker.execComposeService("app", "api", ["sh", "-c", "echo ok"]);

    expect(runner).toHaveBeenNthCalledWith(1, [
      "compose",
      "--project-name",
      "app",
      "--project-directory",
      "/workspace/app",
      "up",
      "--detach",
      "api"
    ]);
    expect(runner).toHaveBeenNthCalledWith(2, [
      "compose",
      "--project-name",
      "app",
      "--project-directory",
      "/workspace/app",
      "down",
      "--remove-orphans"
    ]);
    expect(runner).toHaveBeenNthCalledWith(3, [
      "compose",
      "--project-name",
      "app",
      "--project-directory",
      "/workspace/app",
      "restart",
      "api"
    ]);
    expect(runner).toHaveBeenNthCalledWith(4, [
      "compose",
      "--project-name",
      "app",
      "--project-directory",
      "/workspace/app",
      "exec",
      "--no-tty",
      "api",
      "sh",
      "-c",
      "echo ok"
    ]);
    expect(runner.mock.calls[1]?.[0]).not.toContain("--volumes");
  });

  it("rejects Compose projects not registered in the environment allowlist", async () => {
    const runner = createRunner();
    const docker = createDockerService({ ...config, composeProjects: {} }, runner);

    await expect(docker.listComposeServices("unknown", [])).rejects.toThrow(
      "Compose project is not allowed by DOCKER_COMPOSE_PROJECTS"
    );
    await expect(docker.listComposeServices("toString", [])).rejects.toThrow(
      "Compose project is not allowed by DOCKER_COMPOSE_PROJECTS"
    );
    expect(runner).not.toHaveBeenCalled();
  });

  it("returns non-streaming Compose stats and config without environment resolution", async () => {
    const runner = createRunner();
    const docker = createDockerService(config, runner);

    await expect(docker.getComposeStats("app", "api")).resolves.toEqual({
      project: "app",
      stats: [
        {
          Name: "app-api-1",
          CPUPerc: "0.10%",
          MemUsage: "10MiB / 1GiB"
        }
      ]
    });
    await expect(docker.getComposeConfig("app")).resolves.toEqual({
      project: "app",
      config: {
        name: "app",
        services: {
          api: { depends_on: { db: { condition: "service_healthy" } } },
          db: {}
        }
      }
    });

    expect(runner).toHaveBeenNthCalledWith(1, [
      "compose",
      "--project-name",
      "app",
      "--project-directory",
      "/workspace/app",
      "stats",
      "--no-stream",
      "--format",
      "json",
      "api"
    ]);
    expect(runner).toHaveBeenNthCalledWith(2, [
      "compose",
      "--project-name",
      "app",
      "--project-directory",
      "/workspace/app",
      "config",
      "--format",
      "json",
      "--no-interpolate",
      "--no-env-resolution"
    ]);
  });

  it("gates Compose image and scale tools behind the write flag", async () => {
    const runner = createRunner();
    const docker = createDockerService(config, runner);

    await expect(docker.pullComposeImages("app", ["api"])).rejects.toThrow(
      "DOCKER_ENABLE_WRITE_TOOLS=true is required"
    );
    await expect(docker.buildComposeServices("app", ["api"])).rejects.toThrow(
      "DOCKER_ENABLE_WRITE_TOOLS=true is required"
    );
    await expect(
      docker.scaleComposeServices("app", [{ service: "api", replicas: 3 }])
    ).rejects.toThrow("DOCKER_ENABLE_WRITE_TOOLS=true is required");
    expect(runner).not.toHaveBeenCalled();
  });

  it("runs enabled Compose pull, build, and scale commands with bounded argv", async () => {
    const runner = createRunner();
    const docker = createDockerService({ ...config, enableWriteTools: true }, runner);

    await docker.pullComposeImages("app", ["api"]);
    await docker.buildComposeServices("app", ["api"]);
    await docker.scaleComposeServices("app", [
      { service: "api", replicas: 3 },
      { service: "worker", replicas: 0 }
    ]);

    expect(runner).toHaveBeenNthCalledWith(1, [
      "compose",
      "--project-name",
      "app",
      "--project-directory",
      "/workspace/app",
      "pull",
      "api"
    ]);
    expect(runner).toHaveBeenNthCalledWith(2, [
      "compose",
      "--project-name",
      "app",
      "--project-directory",
      "/workspace/app",
      "build",
      "api"
    ]);
    expect(runner).toHaveBeenNthCalledWith(3, [
      "compose",
      "--project-name",
      "app",
      "--project-directory",
      "/workspace/app",
      "scale",
      "api=3",
      "worker=0"
    ]);
  });

  it("returns Compose service port, process, and image diagnostics", async () => {
    const runner = createRunner();
    const docker = createDockerService(config, runner);

    await expect(
      docker.getComposeServicePort("app", "api", 8080, "tcp")
    ).resolves.toEqual({
      project: "app",
      service: "api",
      privatePort: 8080,
      protocol: "tcp",
      publicPorts: ["0.0.0.0:8080"]
    });
    await expect(docker.listComposeServiceProcesses("app", ["api"])).resolves.toEqual({
      project: "app",
      processes: "PID  COMMAND\n123  node server.js\n"
    });
    await expect(docker.listComposeServiceImages("app", ["api"])).resolves.toEqual({
      project: "app",
      images: [{ Container: "app-api-1", Repository: "api", Tag: "latest" }]
    });

    expect(runner).toHaveBeenNthCalledWith(1, [
      "compose",
      "--project-name",
      "app",
      "--project-directory",
      "/workspace/app",
      "port",
      "--protocol",
      "tcp",
      "api",
      "8080"
    ]);
    expect(runner).toHaveBeenNthCalledWith(2, [
      "compose",
      "--project-name",
      "app",
      "--project-directory",
      "/workspace/app",
      "top",
      "api"
    ]);
    expect(runner).toHaveBeenNthCalledWith(3, [
      "compose",
      "--project-name",
      "app",
      "--project-directory",
      "/workspace/app",
      "images",
      "--format",
      "json",
      "api"
    ]);
  });

  it("gates Compose start, stop, pause, and unpause tools behind the write flag", async () => {
    const runner = createRunner();
    const docker = createDockerService(config, runner);

    await expect(docker.startComposeServices("app", ["api"])).rejects.toThrow(
      "DOCKER_ENABLE_WRITE_TOOLS=true is required"
    );
    await expect(docker.stopComposeServices("app", ["api"])).rejects.toThrow(
      "DOCKER_ENABLE_WRITE_TOOLS=true is required"
    );
    await expect(docker.pauseComposeServices("app", ["api"])).rejects.toThrow(
      "DOCKER_ENABLE_WRITE_TOOLS=true is required"
    );
    await expect(docker.unpauseComposeServices("app", ["api"])).rejects.toThrow(
      "DOCKER_ENABLE_WRITE_TOOLS=true is required"
    );
    expect(runner).not.toHaveBeenCalled();
  });

  it("runs enabled Compose lifecycle commands for selected services", async () => {
    const runner = createRunner();
    const docker = createDockerService({ ...config, enableWriteTools: true }, runner);

    await docker.startComposeServices("app", ["api"]);
    await docker.stopComposeServices("app", ["api"]);
    await docker.pauseComposeServices("app", ["api"]);
    await docker.unpauseComposeServices("app", ["api"]);

    for (const [index, command] of ["start", "stop", "pause", "unpause"].entries()) {
      expect(runner).toHaveBeenNthCalledWith(index + 1, [
        "compose",
        "--project-name",
        "app",
        "--project-directory",
        "/workspace/app",
        command,
        "api"
      ]);
    }
  });

  it("returns bounded recent Compose events and healthcheck status", async () => {
    const runner = createRunner();
    const now = () => new Date("2026-07-16T00:00:00.000Z");
    const docker = createDockerService(config, runner, now);

    await expect(docker.getComposeEvents("app", 5)).resolves.toEqual({
      project: "app",
      since: "2026-07-15T23:55:00.000Z",
      until: "2026-07-16T00:00:00.000Z",
      events: [
        { type: "container", action: "start" },
        { type: "container", action: "health_status: healthy" }
      ]
    });
    await expect(docker.getComposeHealthStatus("app", ["api"])).resolves.toEqual({
      project: "app",
      containers: [
        {
          id: "container-id",
          name: "app-api-1",
          service: "api",
          state: "running",
          health: { Status: "healthy" }
        }
      ],
      truncated: false
    });

    expect(runner).toHaveBeenNthCalledWith(1, [
      "compose",
      "--project-name",
      "app",
      "--project-directory",
      "/workspace/app",
      "events",
      "--json",
      "--since",
      "2026-07-15T23:55:00.000Z",
      "--until",
      "2026-07-16T00:00:00.000Z"
    ]);
    expect(runner).toHaveBeenNthCalledWith(2, [
      "compose",
      "--project-name",
      "app",
      "--project-directory",
      "/workspace/app",
      "ps",
      "--all",
      "--format",
      "json",
      "api"
    ]);
    expect(runner).toHaveBeenNthCalledWith(3, [
      "container",
      "inspect",
      "--format",
      "{{json .State.Health}}",
      "container-id"
    ]);
  });

  it("reports declared Compose service dependencies without resolving environment values", async () => {
    const runner = createRunner();
    const docker = createDockerService(config, runner);

    await expect(docker.getComposeServiceDependencies("app", undefined)).resolves.toEqual({
      project: "app",
      services: [
        {
          service: "api",
          dependencies: [
            { service: "db", condition: "service_healthy" }
          ]
        },
        { service: "db", dependencies: [] }
      ]
    });
    await expect(docker.getComposeServiceDependencies("app", "api")).resolves.toEqual({
      project: "app",
      services: [
        {
          service: "api",
          dependencies: [
            { service: "db", condition: "service_healthy" }
          ]
        }
      ]
    });

    expect(runner).toHaveBeenNthCalledWith(1, [
      "compose",
      "--project-name",
      "app",
      "--project-directory",
      "/workspace/app",
      "config",
      "--format",
      "json",
      "--no-interpolate",
      "--no-env-resolution"
    ]);
  });

  it("returns container stats and network and volume metadata", async () => {
    const runner = createRunner();
    const docker = createDockerService(config, runner);

    await expect(docker.getContainerStats(["api"])).resolves.toEqual({
      stats: [{ Name: "api", CPUPerc: "0.20%" }]
    });
    await expect(docker.listNetworks()).resolves.toEqual({
      networks: [{ ID: "net-id", Name: "app-net" }]
    });
    await expect(docker.inspectNetwork("app-net")).resolves.toEqual({
      network: { Id: "net-id", Name: "app-net" }
    });
    await expect(docker.listVolumes()).resolves.toEqual({
      volumes: [{ Name: "app-data", Driver: "local" }]
    });
    await expect(docker.inspectVolume("app-data")).resolves.toEqual({
      volume: { Name: "app-data", Driver: "local" }
    });

    expect(runner).toHaveBeenNthCalledWith(1, [
      "container",
      "stats",
      "--no-stream",
      "--format",
      "json",
      "api"
    ]);
    expect(runner).toHaveBeenNthCalledWith(2, [
      "network",
      "ls",
      "--format",
      "{{json .}}"
    ]);
    expect(runner).toHaveBeenNthCalledWith(3, ["network", "inspect", "app-net"]);
    expect(runner).toHaveBeenNthCalledWith(4, [
      "volume",
      "ls",
      "--format",
      "{{json .}}"
    ]);
    expect(runner).toHaveBeenNthCalledWith(5, ["volume", "inspect", "app-data"]);
  });

  it("enforces container, network, and volume allowlists for detailed reads", async () => {
    const runner = createRunner();
    const docker = createDockerService(
      {
        ...config,
        allowedContainers: ["api"],
        allowedNetworks: ["app-net"],
        allowedVolumes: ["app-data"]
      },
      runner
    );

    await expect(docker.getContainerStats(["worker"])).rejects.toThrow(
      "Container is not allowed by DOCKER_ALLOWED_CONTAINERS"
    );
    await expect(docker.inspectNetwork("other-net")).rejects.toThrow(
      "Network is not allowed by DOCKER_ALLOWED_NETWORKS"
    );
    await expect(docker.inspectVolume("other-data")).rejects.toThrow(
      "Volume is not allowed by DOCKER_ALLOWED_VOLUMES"
    );
    expect(runner).not.toHaveBeenCalled();
  });

  it("filters network and volume listings with their configured allowlists", async () => {
    const runner = createRunner();
    const docker = createDockerService(
      {
        ...config,
        allowedNetworks: ["net-id"],
        allowedVolumes: ["other-data"]
      },
      runner
    );

    await expect(docker.listNetworks()).resolves.toEqual({
      networks: [{ ID: "net-id", Name: "app-net" }]
    });
    await expect(docker.listVolumes()).resolves.toEqual({ volumes: [] });
  });
});
