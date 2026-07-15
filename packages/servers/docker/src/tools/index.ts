import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { DockerConfig } from "../config.js";
import type { DockerService } from "../services/docker-client.js";
import { createDockerToolSchemas } from "./schemas.js";

const response = <T extends object>(value: T) => ({
  content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
  structuredContent: value
});

const assertWriteToolsEnabled = (config: DockerConfig) => {
  if (!config.enableWriteTools) {
    throw new Error(
      "DOCKER_ENABLE_WRITE_TOOLS=true is required to use start_container, restart_container, and exec_container."
    );
  }
};

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
      description: "Read the current Docker Engine and CLI version information."
    },
    async () => response(await docker.getDockerInfo())
  );

  server.registerTool(
    "list_containers",
    {
      title: "List Containers",
      description: "List Docker containers in the current Docker context.",
      inputSchema: schemas.listContainers.shape
    },
    async ({ all = true }) => response(await docker.listContainers(all))
  );

  server.registerTool(
    "inspect_container",
    {
      title: "Inspect Container",
      description: "Read detailed Docker metadata for one allowed container.",
      inputSchema: schemas.container.shape
    },
    async ({ container }) => response(await docker.inspectContainer(container))
  );

  server.registerTool(
    "get_container_logs",
    {
      title: "Get Container Logs",
      description: "Read a bounded number of log lines from one allowed container.",
      inputSchema: schemas.logs.shape
    },
    async ({ container, tail }) =>
      response(await docker.getContainerLogs(container, tail ?? config.maxLogLines))
  );

  server.registerTool(
    "list_images",
    {
      title: "List Images",
      description: "List Docker images in the current Docker context."
    },
    async () => response(await docker.listImages())
  );

  server.registerTool(
    "list_compose_projects",
    {
      title: "List Compose Projects",
      description: "List Docker Compose projects in the current Docker context."
    },
    async () => response(await docker.listComposeProjects())
  );

  server.registerTool(
    "list_compose_services",
    {
      title: "List Compose Services",
      description:
        "List containers for a project configured in DOCKER_COMPOSE_PROJECTS.",
      inputSchema: schemas.composeServices.shape
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
      inputSchema: schemas.composeLogs.shape
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
      inputSchema: schemas.composeStats.shape
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
      inputSchema: schemas.composeProject.shape
    },
    async ({ project }) => response(await docker.getComposeConfig(project))
  );

  server.registerTool(
    "get_compose_service_port",
    {
      title: "Get Compose Service Port",
      description:
        "Resolve public bindings for one service private port in a configured Compose project.",
      inputSchema: schemas.composePort.shape
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
      inputSchema: schemas.composeServices.shape
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
      inputSchema: schemas.composeServices.shape
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
      inputSchema: schemas.composeEvents.shape
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
      inputSchema: schemas.composeHealth.shape
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
      inputSchema: schemas.composeDependencies.shape
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
      inputSchema: schemas.containerStats.shape
    },
    async ({ containers }) => response(await docker.getContainerStats(containers ?? []))
  );

  server.registerTool(
    "list_networks",
    {
      title: "List Networks",
      description: "List Docker networks, filtered by DOCKER_ALLOWED_NETWORKS when set."
    },
    async () => response(await docker.listNetworks())
  );

  server.registerTool(
    "inspect_network",
    {
      title: "Inspect Network",
      description: "Read detailed metadata for one allowed Docker network.",
      inputSchema: schemas.resource.shape
    },
    async ({ name }) => response(await docker.inspectNetwork(name))
  );

  server.registerTool(
    "list_volumes",
    {
      title: "List Volumes",
      description: "List Docker volumes, filtered by DOCKER_ALLOWED_VOLUMES when set."
    },
    async () => response(await docker.listVolumes())
  );

  server.registerTool(
    "inspect_volume",
    {
      title: "Inspect Volume",
      description: "Read detailed metadata for one allowed Docker volume.",
      inputSchema: schemas.resource.shape
    },
    async ({ name }) => response(await docker.inspectVolume(name))
  );

  server.registerTool(
    "start_container",
    {
      title: "Start Container",
      description:
        "Start one allowed container. Requires DOCKER_ENABLE_WRITE_TOOLS=true.",
      inputSchema: schemas.container.shape
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
      inputSchema: schemas.container.shape
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
      inputSchema: schemas.exec.shape
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
      inputSchema: schemas.composeServices.shape
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
      inputSchema: schemas.composeDown.shape
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
      inputSchema: schemas.composeServices.shape
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
      inputSchema: schemas.composeExec.shape
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
      inputSchema: schemas.composeServices.shape
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
      inputSchema: schemas.composeServices.shape
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
      inputSchema: schemas.composeScale.shape
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
      inputSchema: schemas.composeServices.shape
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
      inputSchema: schemas.composeServices.shape
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
      inputSchema: schemas.composeServices.shape
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
      inputSchema: schemas.composeServices.shape
    },
    async ({ project, services }) => {
      assertWriteToolsEnabled(config);
      return response(await docker.unpauseComposeServices(project, services ?? []));
    }
  );
};
