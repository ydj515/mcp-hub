import { assertFeatureEnabled } from "@mcp-hub/core";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { DockerConfig } from "../config.js";
import type { DockerService } from "../services/docker-client.js";
import { createDockerToolSchemas } from "./schemas.js";

const response = <T extends object>(value: T) => ({
  content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
  structuredContent: value
});

// 조회·검사·로그·상태 tool은 Docker를 바꾸지 않고 로컬 daemon에 국한됩니다.
const readOnly = {
  readOnlyHint: true,
  openWorldHint: false
} as const;

// 시작/중지/일시정지처럼 컨테이너를 제거하지 않고, 반복해도 최종 상태가 같은 write.
const stateToggle = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false
} as const;

// 재시작이나 임의 명령 실행처럼 실행을 중단시키거나 부수효과가 있어 파괴적이고 비멱등인 write.
const destructive = {
  readOnlyHint: false,
  destructiveHint: true,
  idempotentHint: false,
  openWorldHint: false
} as const;

// down/scale처럼 컨테이너를 제거할 수 있지만 반복하면 최종 상태가 같은 write.
const destructiveIdempotent = {
  readOnlyHint: false,
  destructiveHint: true,
  idempotentHint: true,
  openWorldHint: false
} as const;

// 이미지 pull처럼 로컬 상태를 파괴하지 않고 반복 안전하지만 외부 레지스트리와 통신하는 write.
const pullWrite = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true
} as const;

// build처럼 매번 산출물이 달라질 수 있고 외부 베이스 이미지를 받는 write.
const buildWrite = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: false,
  openWorldHint: true
} as const;

const assertWriteToolsEnabled = (config: DockerConfig) =>
  assertFeatureEnabled(
    config.enableWriteTools,
    "DOCKER_ENABLE_WRITE_TOOLS=true is required to use start_container, restart_container, and exec_container."
  );

export const registerDockerTools = (
  server: McpServer,
  docker: DockerService,
  config: DockerConfig
) => {
  const schemas = createDockerToolSchemas(
    config.maxLogLines,
    config.maxEventLookbackMinutes
  );

  server.registerTool(
    "get_docker_info",
    {
      title: "Get Docker Info",
      description: "Read the current Docker Engine and CLI version information.",
      annotations: readOnly
    },
    async () => response(await docker.getDockerInfo())
  );

  server.registerTool(
    "list_containers",
    {
      title: "List Containers",
      description: "List Docker containers in the current Docker context.",
      inputSchema: schemas.listContainers.shape,
      annotations: readOnly
    },
    async ({ all = true }) => response(await docker.listContainers(all))
  );

  server.registerTool(
    "inspect_container",
    {
      title: "Inspect Container",
      description: "Read detailed Docker metadata for one allowed container.",
      inputSchema: schemas.container.shape,
      annotations: readOnly
    },
    async ({ container }) => response(await docker.inspectContainer(container))
  );

  server.registerTool(
    "get_container_logs",
    {
      title: "Get Container Logs",
      description: "Read a bounded number of log lines from one allowed container.",
      inputSchema: schemas.logs.shape,
      annotations: readOnly
    },
    async ({ container, tail }) =>
      response(await docker.getContainerLogs(container, tail ?? config.maxLogLines))
  );

  server.registerTool(
    "list_images",
    {
      title: "List Images",
      description: "List Docker images in the current Docker context.",
      annotations: readOnly
    },
    async () => response(await docker.listImages())
  );

  server.registerTool(
    "list_compose_projects",
    {
      title: "List Compose Projects",
      description: "List Docker Compose projects in the current Docker context.",
      annotations: readOnly
    },
    async () => response(await docker.listComposeProjects())
  );

  server.registerTool(
    "list_compose_services",
    {
      title: "List Compose Services",
      description:
        "List containers for a project configured in DOCKER_COMPOSE_PROJECTS.",
      inputSchema: schemas.composeServices.shape,
      annotations: readOnly
    },
    async ({ project, services }) =>
      response(await docker.listComposeServices(project, services ?? []))
  );

  server.registerTool(
    "get_compose_logs",
    {
      title: "Get Compose Logs",
      description:
        "Read bounded logs for one configured Compose project or service.",
      inputSchema: schemas.composeLogs.shape,
      annotations: readOnly
    },
    async ({ project, service, tail }) =>
      response(
        await docker.getComposeLogs(
          project,
          service,
          tail ?? config.maxLogLines
        )
      )
  );

  server.registerTool(
    "get_compose_stats",
    {
      title: "Get Compose Stats",
      description:
        "Read one non-streaming resource usage snapshot for a configured Compose project or service.",
      inputSchema: schemas.composeStats.shape,
      annotations: readOnly
    },
    async ({ project, service }) =>
      response(await docker.getComposeStats(project, service))
  );

  server.registerTool(
    "get_compose_config",
    {
      title: "Get Compose Config",
      description:
        "Render configured Compose JSON without interpolating environment values or resolving env files.",
      inputSchema: schemas.composeProject.shape,
      annotations: readOnly
    },
    async ({ project }) => response(await docker.getComposeConfig(project))
  );

  server.registerTool(
    "get_compose_service_port",
    {
      title: "Get Compose Service Port",
      description:
        "Resolve public bindings for one service private port in a configured Compose project.",
      inputSchema: schemas.composePort.shape,
      annotations: readOnly
    },
    async ({ project, service, private_port, protocol }) =>
      response(
        await docker.getComposeServicePort(
          project,
          service,
          private_port,
          protocol ?? "tcp"
        )
      )
  );

  server.registerTool(
    "list_compose_service_processes",
    {
      title: "List Compose Service Processes",
      description:
        "Return the Compose process table for all or selected services in a configured project.",
      inputSchema: schemas.composeServices.shape,
      annotations: readOnly
    },
    async ({ project, services }) =>
      response(await docker.listComposeServiceProcesses(project, services ?? []))
  );

  server.registerTool(
    "list_compose_service_images",
    {
      title: "List Compose Service Images",
      description:
        "List images used by all or selected services in a configured Compose project.",
      inputSchema: schemas.composeServices.shape,
      annotations: readOnly
    },
    async ({ project, services }) =>
      response(await docker.listComposeServiceImages(project, services ?? []))
  );

  server.registerTool(
    "get_compose_events",
    {
      title: "Get Compose Events",
      description:
        "Read a bounded historical event snapshot for a configured Compose project.",
      inputSchema: schemas.composeEvents.shape,
      annotations: readOnly
    },
    async ({ project, since_minutes }) =>
      response(
        await docker.getComposeEvents(
          project,
          since_minutes ?? config.eventsLookbackMinutes
        )
      )
  );

  server.registerTool(
    "get_compose_health_status",
    {
      title: "Get Compose Health Status",
      description:
        "Read Docker healthcheck state for containers in a configured Compose project.",
      inputSchema: schemas.composeHealth.shape,
      annotations: readOnly
    },
    async ({ project, services }) =>
      response(await docker.getComposeHealthStatus(project, services ?? []))
  );

  server.registerTool(
    "get_compose_service_dependencies",
    {
      title: "Get Compose Service Dependencies",
      description:
        "Read declared Compose service dependencies without resolving environment values.",
      inputSchema: schemas.composeDependencies.shape,
      annotations: readOnly
    },
    async ({ project, service }) =>
      response(await docker.getComposeServiceDependencies(project, service))
  );

  server.registerTool(
    "get_container_stats",
    {
      title: "Get Container Stats",
      description:
        "Read one non-streaming resource usage snapshot for all allowed or selected containers.",
      inputSchema: schemas.containerStats.shape,
      annotations: readOnly
    },
    async ({ containers }) => response(await docker.getContainerStats(containers ?? []))
  );

  server.registerTool(
    "list_networks",
    {
      title: "List Networks",
      description: "List Docker networks, filtered by DOCKER_ALLOWED_NETWORKS when set.",
      annotations: readOnly
    },
    async () => response(await docker.listNetworks())
  );

  server.registerTool(
    "inspect_network",
    {
      title: "Inspect Network",
      description: "Read detailed metadata for one allowed Docker network.",
      inputSchema: schemas.resource.shape,
      annotations: readOnly
    },
    async ({ name }) => response(await docker.inspectNetwork(name))
  );

  server.registerTool(
    "list_volumes",
    {
      title: "List Volumes",
      description: "List Docker volumes, filtered by DOCKER_ALLOWED_VOLUMES when set.",
      annotations: readOnly
    },
    async () => response(await docker.listVolumes())
  );

  server.registerTool(
    "inspect_volume",
    {
      title: "Inspect Volume",
      description: "Read detailed metadata for one allowed Docker volume.",
      inputSchema: schemas.resource.shape,
      annotations: readOnly
    },
    async ({ name }) => response(await docker.inspectVolume(name))
  );

  server.registerTool(
    "start_container",
    {
      title: "Start Container",
      description:
        "Start one allowed container. Requires DOCKER_ENABLE_WRITE_TOOLS=true.",
      inputSchema: schemas.container.shape,
      annotations: stateToggle
    },
    async ({ container }) => {
      assertWriteToolsEnabled(config);
      return response(await docker.startContainer(container));
    }
  );

  server.registerTool(
    "restart_container",
    {
      title: "Restart Container",
      description:
        "Restart one allowed container. Requires DOCKER_ENABLE_WRITE_TOOLS=true.",
      inputSchema: schemas.container.shape,
      annotations: destructive
    },
    async ({ container }) => {
      assertWriteToolsEnabled(config);
      return response(await docker.restartContainer(container));
    }
  );

  server.registerTool(
    "exec_container",
    {
      title: "Execute Container Command",
      description:
        "Run an argv command inside one allowed container. Requires DOCKER_ENABLE_WRITE_TOOLS=true.",
      inputSchema: schemas.exec.shape,
      annotations: destructive
    },
    async ({ container, command }) => {
      assertWriteToolsEnabled(config);
      return response(await docker.execContainer(container, command));
    }
  );

  server.registerTool(
    "up_compose_project",
    {
      title: "Start Compose Project",
      description:
        "Create and start a configured Compose project in detached mode. Requires DOCKER_ENABLE_WRITE_TOOLS=true.",
      inputSchema: schemas.composeServices.shape,
      annotations: stateToggle
    },
    async ({ project, services }) => {
      assertWriteToolsEnabled(config);
      return response(await docker.upComposeProject(project, services ?? []));
    }
  );

  server.registerTool(
    "down_compose_project",
    {
      title: "Stop and Remove Compose Project",
      description:
        "Stop and remove Compose containers and networks without deleting volumes or images. Requires DOCKER_ENABLE_WRITE_TOOLS=true.",
      inputSchema: schemas.composeDown.shape,
      annotations: destructiveIdempotent
    },
    async ({ project, remove_orphans }) => {
      assertWriteToolsEnabled(config);
      return response(
        await docker.downComposeProject(project, remove_orphans ?? false)
      );
    }
  );

  server.registerTool(
    "restart_compose_services",
    {
      title: "Restart Compose Services",
      description:
        "Restart all or selected services in a configured Compose project. Requires DOCKER_ENABLE_WRITE_TOOLS=true.",
      inputSchema: schemas.composeServices.shape,
      annotations: destructive
    },
    async ({ project, services }) => {
      assertWriteToolsEnabled(config);
      return response(await docker.restartComposeServices(project, services ?? []));
    }
  );

  server.registerTool(
    "exec_compose_service",
    {
      title: "Execute Compose Service Command",
      description:
        "Run an argv command in a configured Compose service without a TTY. Requires DOCKER_ENABLE_WRITE_TOOLS=true.",
      inputSchema: schemas.composeExec.shape,
      annotations: destructive
    },
    async ({ project, service, command }) => {
      assertWriteToolsEnabled(config);
      return response(await docker.execComposeService(project, service, command));
    }
  );

  server.registerTool(
    "pull_compose_images",
    {
      title: "Pull Compose Images",
      description:
        "Pull images for all or selected services in a configured Compose project. Requires DOCKER_ENABLE_WRITE_TOOLS=true.",
      inputSchema: schemas.composeServices.shape,
      annotations: pullWrite
    },
    async ({ project, services }) => {
      assertWriteToolsEnabled(config);
      return response(await docker.pullComposeImages(project, services ?? []));
    }
  );

  server.registerTool(
    "build_compose_services",
    {
      title: "Build Compose Services",
      description:
        "Build all or selected services in a configured Compose project. Requires DOCKER_ENABLE_WRITE_TOOLS=true.",
      inputSchema: schemas.composeServices.shape,
      annotations: buildWrite
    },
    async ({ project, services }) => {
      assertWriteToolsEnabled(config);
      return response(await docker.buildComposeServices(project, services ?? []));
    }
  );

  server.registerTool(
    "scale_compose_services",
    {
      title: "Scale Compose Services",
      description:
        "Set 0 to 100 replicas for selected services in a configured Compose project. Requires DOCKER_ENABLE_WRITE_TOOLS=true.",
      inputSchema: schemas.composeScale.shape,
      annotations: destructiveIdempotent
    },
    async ({ project, replicas }) => {
      assertWriteToolsEnabled(config);
      return response(await docker.scaleComposeServices(project, replicas));
    }
  );

  server.registerTool(
    "start_compose_services",
    {
      title: "Start Compose Services",
      description:
        "Start all or selected existing Compose services. Requires DOCKER_ENABLE_WRITE_TOOLS=true.",
      inputSchema: schemas.composeServices.shape,
      annotations: stateToggle
    },
    async ({ project, services }) => {
      assertWriteToolsEnabled(config);
      return response(await docker.startComposeServices(project, services ?? []));
    }
  );

  server.registerTool(
    "stop_compose_services",
    {
      title: "Stop Compose Services",
      description:
        "Stop all or selected Compose services without removing containers. Requires DOCKER_ENABLE_WRITE_TOOLS=true.",
      inputSchema: schemas.composeServices.shape,
      annotations: stateToggle
    },
    async ({ project, services }) => {
      assertWriteToolsEnabled(config);
      return response(await docker.stopComposeServices(project, services ?? []));
    }
  );

  server.registerTool(
    "pause_compose_services",
    {
      title: "Pause Compose Services",
      description:
        "Pause all or selected running Compose services. Requires DOCKER_ENABLE_WRITE_TOOLS=true.",
      inputSchema: schemas.composeServices.shape,
      annotations: stateToggle
    },
    async ({ project, services }) => {
      assertWriteToolsEnabled(config);
      return response(await docker.pauseComposeServices(project, services ?? []));
    }
  );

  server.registerTool(
    "unpause_compose_services",
    {
      title: "Unpause Compose Services",
      description:
        "Unpause all or selected Compose services. Requires DOCKER_ENABLE_WRITE_TOOLS=true.",
      inputSchema: schemas.composeServices.shape,
      annotations: stateToggle
    },
    async ({ project, services }) => {
      assertWriteToolsEnabled(config);
      return response(await docker.unpauseComposeServices(project, services ?? []));
    }
  );
};
