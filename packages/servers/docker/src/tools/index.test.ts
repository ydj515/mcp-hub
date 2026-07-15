import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { describe, expect, it, vi } from "vitest";
import type { DockerConfig } from "../config.js";
import type { DockerService } from "../services/docker-client.js";
import { registerDockerTools } from "./index.js";
import { createDockerToolSchemas } from "./schemas.js";

type ToolHandler = (input: Record<string, unknown>) => Promise<{
  structuredContent: unknown;
}>;

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

const createDocker = () => ({
  getDockerInfo: vi.fn().mockResolvedValue({ info: {}, version: {} }),
  listContainers: vi.fn().mockResolvedValue({ containers: [] }),
  inspectContainer: vi.fn().mockResolvedValue({ container: {} }),
  getContainerLogs: vi.fn().mockResolvedValue({ logs: "" }),
  listImages: vi.fn().mockResolvedValue({ images: [] }),
  listComposeProjects: vi.fn().mockResolvedValue({ projects: [] }),
  listComposeServices: vi.fn().mockResolvedValue({ project: "app", services: [] }),
  getComposeLogs: vi.fn().mockResolvedValue({ project: "app", logs: "" }),
  getComposeStats: vi.fn().mockResolvedValue({ project: "app", stats: [] }),
  getComposeConfig: vi.fn().mockResolvedValue({ project: "app", config: {} }),
  upComposeProject: vi.fn().mockResolvedValue({ project: "app", output: "" }),
  downComposeProject: vi.fn().mockResolvedValue({ project: "app", output: "" }),
  restartComposeServices: vi.fn().mockResolvedValue({ project: "app", output: "" }),
  execComposeService: vi.fn().mockResolvedValue({ stdout: "ok\n", stderr: "" }),
  pullComposeImages: vi.fn().mockResolvedValue({ project: "app", output: "" }),
  buildComposeServices: vi.fn().mockResolvedValue({ project: "app", output: "" }),
  scaleComposeServices: vi.fn().mockResolvedValue({ project: "app", output: "" }),
  getComposeServicePort: vi.fn().mockResolvedValue({
    project: "app",
    service: "api",
    privatePort: 8080,
    protocol: "tcp",
    publicPorts: []
  }),
  listComposeServiceProcesses: vi.fn().mockResolvedValue({
    project: "app",
    processes: ""
  }),
  listComposeServiceImages: vi.fn().mockResolvedValue({ project: "app", images: [] }),
  startComposeServices: vi.fn().mockResolvedValue({ project: "app", output: "" }),
  stopComposeServices: vi.fn().mockResolvedValue({ project: "app", output: "" }),
  pauseComposeServices: vi.fn().mockResolvedValue({ project: "app", output: "" }),
  unpauseComposeServices: vi.fn().mockResolvedValue({ project: "app", output: "" }),
  getComposeEvents: vi.fn().mockResolvedValue({ project: "app", events: [] }),
  getComposeHealthStatus: vi.fn().mockResolvedValue({
    project: "app",
    containers: [],
    truncated: false
  }),
  getComposeServiceDependencies: vi.fn().mockResolvedValue({
    project: "app",
    services: []
  }),
  getContainerStats: vi.fn().mockResolvedValue({ stats: [] }),
  listNetworks: vi.fn().mockResolvedValue({ networks: [] }),
  inspectNetwork: vi.fn().mockResolvedValue({ network: {} }),
  listVolumes: vi.fn().mockResolvedValue({ volumes: [] }),
  inspectVolume: vi.fn().mockResolvedValue({ volume: {} }),
  startContainer: vi.fn().mockResolvedValue({ container: "api", output: "api\n" }),
  restartContainer: vi.fn().mockResolvedValue({ container: "api", output: "api\n" }),
  execContainer: vi.fn().mockResolvedValue({ stdout: "ok\n", stderr: "" })
});

describe("createDockerToolSchemas", () => {
  it("limits log lines and exec command arguments", () => {
    const schemas = createDockerToolSchemas(100);

    expect(() => schemas.logs.parse({ container: "api", tail: 101 })).toThrow();
    expect(() => schemas.exec.parse({ container: "api", command: [] })).toThrow();
    expect(() =>
      schemas.exec.parse({ container: "api", command: Array.from({ length: 33 }, () => "echo") })
    ).toThrow();
    expect(() =>
      schemas.composeExec.parse({ project: "app", service: "api", command: [] })
    ).toThrow();
    expect(() =>
      schemas.composeScale.parse({
        project: "app",
        replicas: [
          { service: "api", replicas: 1 },
          { service: "api", replicas: 2 }
        ]
      })
    ).toThrow();
    expect(() =>
      schemas.composePort.parse({ project: "app", service: "api", private_port: 0 })
    ).toThrow();
    expect(() => schemas.composeEvents.parse({ project: "app", since_minutes: 61 })).toThrow();
    expect(() => schemas.container.parse({ container: "--format" })).toThrow();
    expect(() => schemas.resource.parse({ name: "--format" })).toThrow();
  });
});

describe("registerDockerTools", () => {
  it("registers twenty-one read tools and fourteen write or execution tools", () => {
    const handlers = new Map<string, ToolHandler>();
    const server = {
      registerTool: (name: string, _definition: unknown, handler: ToolHandler) =>
        handlers.set(name, handler)
    } as unknown as McpServer;

    registerDockerTools(server, createDocker() as unknown as DockerService, config);

    expect([...handlers.keys()]).toEqual([
      "get_docker_info",
      "list_containers",
      "inspect_container",
      "get_container_logs",
      "list_images",
      "list_compose_projects",
      "list_compose_services",
      "get_compose_logs",
      "get_compose_stats",
      "get_compose_config",
      "get_compose_service_port",
      "list_compose_service_processes",
      "list_compose_service_images",
      "get_compose_events",
      "get_compose_health_status",
      "get_compose_service_dependencies",
      "get_container_stats",
      "list_networks",
      "inspect_network",
      "list_volumes",
      "inspect_volume",
      "start_container",
      "restart_container",
      "exec_container",
      "up_compose_project",
      "down_compose_project",
      "restart_compose_services",
      "exec_compose_service",
      "pull_compose_images",
      "build_compose_services",
      "scale_compose_services",
      "start_compose_services",
      "stop_compose_services",
      "pause_compose_services",
      "unpause_compose_services"
    ]);
  });

  it("uses safe defaults and exposes structured output", async () => {
    const handlers = new Map<string, ToolHandler>();
    const server = {
      registerTool: (name: string, _definition: unknown, handler: ToolHandler) =>
        handlers.set(name, handler)
    } as unknown as McpServer;
    const docker = createDocker();

    registerDockerTools(server, docker as unknown as DockerService, config);

    await expect(handlers.get("list_containers")!({})).resolves.toMatchObject({
      structuredContent: { containers: [] }
    });
    await expect(
      handlers.get("get_container_logs")!({ container: "api" })
    ).resolves.toMatchObject({ structuredContent: { logs: "" } });
    await expect(
      handlers.get("list_compose_services")!({ project: "app" })
    ).resolves.toMatchObject({ structuredContent: { project: "app", services: [] } });
    await expect(
      handlers.get("get_compose_logs")!({ project: "app", service: "api" })
    ).resolves.toMatchObject({ structuredContent: { project: "app", logs: "" } });
    await expect(
      handlers.get("get_compose_stats")!({ project: "app" })
    ).resolves.toMatchObject({ structuredContent: { project: "app", stats: [] } });
    await expect(
      handlers.get("get_compose_config")!({ project: "app" })
    ).resolves.toMatchObject({ structuredContent: { project: "app", config: {} } });
    await expect(
      handlers.get("get_compose_service_port")!({
        project: "app",
        service: "api",
        private_port: 8080
      })
    ).resolves.toMatchObject({ structuredContent: { publicPorts: [] } });
    await expect(
      handlers.get("list_compose_service_processes")!({ project: "app" })
    ).resolves.toMatchObject({ structuredContent: { processes: "" } });
    await expect(
      handlers.get("list_compose_service_images")!({ project: "app" })
    ).resolves.toMatchObject({ structuredContent: { images: [] } });
    await expect(
      handlers.get("get_compose_events")!({ project: "app" })
    ).resolves.toMatchObject({ structuredContent: { events: [] } });
    await expect(
      handlers.get("get_compose_health_status")!({ project: "app" })
    ).resolves.toMatchObject({ structuredContent: { containers: [], truncated: false } });
    await expect(
      handlers.get("get_compose_service_dependencies")!({ project: "app" })
    ).resolves.toMatchObject({ structuredContent: { services: [] } });
    await expect(handlers.get("get_container_stats")!({})).resolves.toMatchObject({
      structuredContent: { stats: [] }
    });
    await expect(handlers.get("list_networks")!({})).resolves.toMatchObject({
      structuredContent: { networks: [] }
    });
    await expect(
      handlers.get("inspect_network")!({ name: "app-net" })
    ).resolves.toMatchObject({ structuredContent: { network: {} } });
    await expect(handlers.get("list_volumes")!({})).resolves.toMatchObject({
      structuredContent: { volumes: [] }
    });
    await expect(
      handlers.get("inspect_volume")!({ name: "app-data" })
    ).resolves.toMatchObject({ structuredContent: { volume: {} } });
    await expect(
      handlers.get("exec_container")!({ container: "api", command: ["printenv"] })
    ).rejects.toThrow("DOCKER_ENABLE_WRITE_TOOLS=true is required");

    expect(docker.listContainers).toHaveBeenCalledWith(true);
    expect(docker.getContainerLogs).toHaveBeenCalledWith("api", 500);
    expect(docker.listComposeServices).toHaveBeenCalledWith("app", []);
    expect(docker.getComposeLogs).toHaveBeenCalledWith("app", "api", 500);
    expect(docker.getComposeStats).toHaveBeenCalledWith("app", undefined);
    expect(docker.getComposeConfig).toHaveBeenCalledWith("app");
    expect(docker.getComposeServicePort).toHaveBeenCalledWith(
      "app",
      "api",
      8080,
      "tcp"
    );
    expect(docker.listComposeServiceProcesses).toHaveBeenCalledWith("app", []);
    expect(docker.listComposeServiceImages).toHaveBeenCalledWith("app", []);
    expect(docker.getComposeEvents).toHaveBeenCalledWith("app", 15);
    expect(docker.getComposeHealthStatus).toHaveBeenCalledWith("app", []);
    expect(docker.getComposeServiceDependencies).toHaveBeenCalledWith("app", undefined);
    expect(docker.getContainerStats).toHaveBeenCalledWith([]);
    expect(docker.listNetworks).toHaveBeenCalledWith();
    expect(docker.inspectNetwork).toHaveBeenCalledWith("app-net");
    expect(docker.listVolumes).toHaveBeenCalledWith();
    expect(docker.inspectVolume).toHaveBeenCalledWith("app-data");
    expect(docker.execContainer).not.toHaveBeenCalled();
  });

  it("delegates execution tools only when write access is enabled", async () => {
    const handlers = new Map<string, ToolHandler>();
    const server = {
      registerTool: (name: string, _definition: unknown, handler: ToolHandler) =>
        handlers.set(name, handler)
    } as unknown as McpServer;
    const docker = createDocker();

    registerDockerTools(
      server,
      docker as unknown as DockerService,
      { ...config, enableWriteTools: true }
    );

    await expect(
      handlers.get("exec_container")!({ container: "api", command: ["printenv"] })
    ).resolves.toMatchObject({ structuredContent: { stdout: "ok\n", stderr: "" } });

    expect(docker.execContainer).toHaveBeenCalledWith("api", ["printenv"]);
    await expect(
      handlers.get("up_compose_project")!({ project: "app", services: ["api"] })
    ).resolves.toMatchObject({ structuredContent: { project: "app", output: "" } });
    await expect(
      handlers.get("down_compose_project")!({ project: "app", remove_orphans: true })
    ).resolves.toMatchObject({ structuredContent: { project: "app", output: "" } });
    await expect(
      handlers.get("restart_compose_services")!({ project: "app", services: ["api"] })
    ).resolves.toMatchObject({ structuredContent: { project: "app", output: "" } });
    await expect(
      handlers.get("exec_compose_service")!({
        project: "app",
        service: "api",
        command: ["printenv"]
      })
    ).resolves.toMatchObject({ structuredContent: { stdout: "ok\n", stderr: "" } });

    expect(docker.upComposeProject).toHaveBeenCalledWith("app", ["api"]);
    expect(docker.downComposeProject).toHaveBeenCalledWith("app", true);
    expect(docker.restartComposeServices).toHaveBeenCalledWith("app", ["api"]);
    expect(docker.execComposeService).toHaveBeenCalledWith("app", "api", ["printenv"]);
    await expect(
      handlers.get("pull_compose_images")!({ project: "app", services: ["api"] })
    ).resolves.toMatchObject({ structuredContent: { project: "app", output: "" } });
    await expect(
      handlers.get("build_compose_services")!({ project: "app", services: ["api"] })
    ).resolves.toMatchObject({ structuredContent: { project: "app", output: "" } });
    await expect(
      handlers.get("scale_compose_services")!({
        project: "app",
        replicas: [{ service: "api", replicas: 3 }]
      })
    ).resolves.toMatchObject({ structuredContent: { project: "app", output: "" } });

    expect(docker.pullComposeImages).toHaveBeenCalledWith("app", ["api"]);
    expect(docker.buildComposeServices).toHaveBeenCalledWith("app", ["api"]);
    expect(docker.scaleComposeServices).toHaveBeenCalledWith("app", [
      { service: "api", replicas: 3 }
    ]);
    for (const tool of [
      "start_compose_services",
      "stop_compose_services",
      "pause_compose_services",
      "unpause_compose_services"
    ]) {
      await expect(
        handlers.get(tool)!({ project: "app", services: ["api"] })
      ).resolves.toMatchObject({ structuredContent: { project: "app", output: "" } });
    }
    expect(docker.startComposeServices).toHaveBeenCalledWith("app", ["api"]);
    expect(docker.stopComposeServices).toHaveBeenCalledWith("app", ["api"]);
    expect(docker.pauseComposeServices).toHaveBeenCalledWith("app", ["api"]);
    expect(docker.unpauseComposeServices).toHaveBeenCalledWith("app", ["api"]);
  });
});
