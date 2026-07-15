import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { DockerConfig } from "../config.js";

const execFileAsync = promisify(execFile);

export type DockerCommandResult = {
  stdout: string;
  stderr: string;
};

export type DockerCommandRunner = (
  args: string[]
) => Promise<DockerCommandResult>;

type DockerCommandError = {
  stderr?: string | Buffer;
  killed?: boolean;
};

type JsonRecord = Record<string, unknown>;

const toText = (value: string | Buffer | undefined) => {
  if (typeof value === "string") {
    return value;
  }
  return value?.toString("utf8") ?? "";
};

const truncate = (value: string, maxLength: number) =>
  value.length > maxLength ? `${value.slice(0, maxLength)}…` : value;

const parseJson = (value: string, source: string): unknown => {
  try {
    return JSON.parse(value.trim());
  } catch {
    throw new Error(`Docker ${source} returned invalid JSON`);
  }
};

const parseJsonLines = (value: string, source: string) =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => parseJson(line, source));

const isRecord = (value: unknown): value is JsonRecord =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const getString = (value: unknown, key: string) =>
  isRecord(value) && typeof value[key] === "string" ? value[key] : undefined;

const combinedOutput = ({ stdout, stderr }: DockerCommandResult) =>
  `${stdout}${stderr}`;

const assertContainerAllowed = (container: string, config: DockerConfig) => {
  if (
    config.allowedContainers &&
    !config.allowedContainers.includes(container)
  ) {
    throw new Error("Container is not allowed by DOCKER_ALLOWED_CONTAINERS");
  }
};

const assertResourceAllowed = (
  resource: string,
  allowedResources: string[] | undefined,
  resourceType: string,
  environmentVariable: string
) => {
  if (allowedResources && !allowedResources.includes(resource)) {
    throw new Error(
      `${resourceType} is not allowed by ${environmentVariable}`
    );
  }
};

const assertWriteToolsEnabled = (config: DockerConfig) => {
  if (!config.enableWriteTools) {
    throw new Error(
      "DOCKER_ENABLE_WRITE_TOOLS=true is required to use start_container, restart_container, and exec_container."
    );
  }
};

const composeCommandPrefix = (project: string, config: DockerConfig) => {
  const directory = config.composeProjects[project];
  if (
    !Object.prototype.hasOwnProperty.call(config.composeProjects, project) ||
    typeof directory !== "string" ||
    !directory
  ) {
    throw new Error("Compose project is not allowed by DOCKER_COMPOSE_PROJECTS");
  }
  return [
    "compose",
    "--project-name",
    project,
    "--project-directory",
    directory
  ];
};

const readComposeConfig = async (
  project: string,
  config: DockerConfig,
  runCommand: DockerCommandRunner
) => {
  const { stdout } = await runCommand([
    ...composeCommandPrefix(project, config),
    "config",
    "--format",
    "json",
    "--no-interpolate",
    "--no-env-resolution"
  ]);
  return parseJson(stdout, "compose config");
};

const dependenciesFromServiceConfig = (serviceConfig: unknown) => {
  const rawDependencies = isRecord(serviceConfig)
    ? serviceConfig.depends_on
    : undefined;

  if (Array.isArray(rawDependencies)) {
    return rawDependencies
      .filter((dependency): dependency is string => typeof dependency === "string")
      .map((service) => ({ service }));
  }

  if (isRecord(rawDependencies)) {
    return Object.entries(rawDependencies).map(([service, options]) => ({
      ...(isRecord(options) ? options : {}),
      service
    }));
  }

  return [];
};

export const createDockerCommandRunner = (
  config: DockerConfig
): DockerCommandRunner => {
  return async (args) => {
    try {
      const { stdout, stderr } = await execFileAsync("docker", args, {
        encoding: "utf8",
        timeout: config.commandTimeoutMs,
        maxBuffer: config.maxOutputBytes
      });
      return { stdout, stderr };
    } catch (error) {
      const commandError = error as DockerCommandError;
      if (commandError.killed) {
        throw new Error(
          `Docker command timed out after ${config.commandTimeoutMs}ms`
        );
      }

      const stderr = truncate(toText(commandError.stderr).trim(), 1_000);
      throw new Error(
        stderr ? `Docker command failed: ${stderr}` : "Docker command failed"
      );
    }
  };
};

export const createDockerService = (
  config: DockerConfig,
  runCommand: DockerCommandRunner = createDockerCommandRunner(config),
  now: () => Date = () => new Date()
) => ({
  async getDockerInfo() {
    const info = await runCommand(["info", "--format", "{{json .}}"]).then(
      ({ stdout }) => parseJson(stdout, "info")
    );
    const version = await runCommand([
      "version",
      "--format",
      "{{json .}}"
    ]).then(({ stdout }) => parseJson(stdout, "version"));
    return { info, version };
  },

  async listContainers(all: boolean) {
    const args = ["container", "ls"];
    if (all) {
      args.push("--all");
    }
    args.push("--format", "{{json .}}");
    const { stdout } = await runCommand(args);
    return { containers: parseJsonLines(stdout, "container ls") };
  },

  async inspectContainer(container: string) {
    assertContainerAllowed(container, config);
    const { stdout } = await runCommand(["container", "inspect", container]);
    const inspected = parseJson(stdout, "container inspect");
    if (!Array.isArray(inspected) || inspected.length !== 1) {
      throw new Error("Docker container inspect returned an unexpected response");
    }
    return { container: inspected[0] };
  },

  async getContainerLogs(container: string, tail: number) {
    assertContainerAllowed(container, config);
    const result = await runCommand([
      "container",
      "logs",
      "--tail",
      String(tail),
      container
    ]);
    return { logs: combinedOutput(result) };
  },

  async getContainerStats(containers: string[]) {
    const targets = containers.length
      ? containers
      : config.allowedContainers ?? [];
    targets.forEach((container) => assertContainerAllowed(container, config));
    const { stdout } = await runCommand([
      "container",
      "stats",
      "--no-stream",
      "--format",
      "json",
      ...targets
    ]);
    return { stats: parseJsonLines(stdout, "container stats") };
  },

  async listNetworks() {
    const { stdout } = await runCommand([
      "network",
      "ls",
      "--format",
      "{{json .}}"
    ]);
    const networks = parseJsonLines(stdout, "network ls");
    return {
      networks: config.allowedNetworks
        ? networks.filter((network) =>
            config.allowedNetworks?.some(
              (allowedNetwork) =>
                allowedNetwork === getString(network, "Name") ||
                allowedNetwork === getString(network, "ID")
            )
          )
        : networks
    };
  },

  async inspectNetwork(network: string) {
    assertResourceAllowed(
      network,
      config.allowedNetworks,
      "Network",
      "DOCKER_ALLOWED_NETWORKS"
    );
    const { stdout } = await runCommand(["network", "inspect", network]);
    const inspected = parseJson(stdout, "network inspect");
    if (!Array.isArray(inspected) || inspected.length !== 1) {
      throw new Error("Docker network inspect returned an unexpected response");
    }
    return { network: inspected[0] };
  },

  async listVolumes() {
    const { stdout } = await runCommand([
      "volume",
      "ls",
      "--format",
      "{{json .}}"
    ]);
    const volumes = parseJsonLines(stdout, "volume ls");
    return {
      volumes: config.allowedVolumes
        ? volumes.filter((volume) =>
            config.allowedVolumes?.includes(getString(volume, "Name") ?? "")
          )
        : volumes
    };
  },

  async inspectVolume(volume: string) {
    assertResourceAllowed(
      volume,
      config.allowedVolumes,
      "Volume",
      "DOCKER_ALLOWED_VOLUMES"
    );
    const { stdout } = await runCommand(["volume", "inspect", volume]);
    const inspected = parseJson(stdout, "volume inspect");
    if (!Array.isArray(inspected) || inspected.length !== 1) {
      throw new Error("Docker volume inspect returned an unexpected response");
    }
    return { volume: inspected[0] };
  },

  async listImages() {
    const { stdout } = await runCommand([
      "image",
      "ls",
      "--format",
      "{{json .}}"
    ]);
    return { images: parseJsonLines(stdout, "image ls") };
  },

  async listComposeProjects() {
    const { stdout } = await runCommand(["compose", "ls", "--format", "json"]);
    const projects = parseJson(stdout, "compose ls");
    if (!Array.isArray(projects)) {
      throw new Error("Docker compose ls returned an unexpected response");
    }
    return { projects };
  },

  async listComposeServices(project: string, services: string[]) {
    const { stdout } = await runCommand([
      ...composeCommandPrefix(project, config),
      "ps",
      "--all",
      "--format",
      "json",
      ...services
    ]);
    const listed = parseJson(stdout, "compose ps");
    if (!Array.isArray(listed)) {
      throw new Error("Docker compose ps returned an unexpected response");
    }
    return { project, services: listed };
  },

  async getComposeLogs(project: string, service: string | undefined, tail: number) {
    const args = [
      ...composeCommandPrefix(project, config),
      "logs",
      "--no-color",
      "--tail",
      String(tail)
    ];
    if (service) {
      args.push(service);
    }
    const result = await runCommand(args);
    return { project, logs: combinedOutput(result) };
  },

  async getComposeStats(project: string, service: string | undefined) {
    const args = [
      ...composeCommandPrefix(project, config),
      "stats",
      "--no-stream",
      "--format",
      "json"
    ];
    if (service) {
      args.push(service);
    }
    const { stdout } = await runCommand(args);
    const stats = parseJson(stdout, "compose stats");
    if (!Array.isArray(stats)) {
      throw new Error("Docker compose stats returned an unexpected response");
    }
    return { project, stats };
  },

  async getComposeConfig(project: string) {
    return { project, config: await readComposeConfig(project, config, runCommand) };
  },

  async getComposeEvents(project: string, sinceMinutes: number) {
    if (
      !Number.isInteger(sinceMinutes) ||
      sinceMinutes < 1 ||
      sinceMinutes > config.maxEventLookbackMinutes
    ) {
      throw new Error(
        "Requested events lookback exceeds DOCKER_MAX_EVENT_LOOKBACK_MINUTES"
      );
    }

    const untilDate = now();
    const sinceDate = new Date(untilDate.getTime() - sinceMinutes * 60_000);
    const since = sinceDate.toISOString();
    const until = untilDate.toISOString();
    const { stdout } = await runCommand([
      ...composeCommandPrefix(project, config),
      "events",
      "--json",
      "--since",
      since,
      "--until",
      until
    ]);
    return {
      project,
      since,
      until,
      events: parseJsonLines(stdout, "compose events")
    };
  },

  async getComposeHealthStatus(project: string, services: string[]) {
    const { stdout } = await runCommand([
      ...composeCommandPrefix(project, config),
      "ps",
      "--all",
      "--format",
      "json",
      ...services
    ]);
    const listed = parseJson(stdout, "compose ps");
    if (!Array.isArray(listed)) {
      throw new Error("Docker compose ps returned an unexpected response");
    }

    const selected = listed.slice(0, config.maxComposeContainers);
    const containers = await Promise.all(
      selected.map(async (container) => {
        const id = getString(container, "ID") ?? getString(container, "Id");
        if (!id) {
          throw new Error("Docker compose ps returned a container without an ID");
        }
        const { stdout: healthOutput } = await runCommand([
          "container",
          "inspect",
          "--format",
          "{{json .State.Health}}",
          id
        ]);
        return {
          id,
          name: getString(container, "Name"),
          service: getString(container, "Service"),
          state: getString(container, "State"),
          health: parseJson(healthOutput, "container health")
        };
      })
    );
    return {
      project,
      containers,
      truncated: listed.length > selected.length
    };
  },

  async getComposeServiceDependencies(
    project: string,
    service: string | undefined
  ) {
    const composeConfig = await readComposeConfig(project, config, runCommand);
    if (!isRecord(composeConfig) || !isRecord(composeConfig.services)) {
      throw new Error(
        "Docker compose config returned an unexpected services response"
      );
    }

    const serviceConfigs = composeConfig.services;
    if (service && !Object.prototype.hasOwnProperty.call(serviceConfigs, service)) {
      throw new Error(`Compose service "${service}" is not defined`);
    }

    const entries = service
      ? [[service, serviceConfigs[service]]]
      : Object.entries(serviceConfigs);
    return {
      project,
      services: entries.map(([serviceName, serviceConfig]) => ({
        service: serviceName,
        dependencies: dependenciesFromServiceConfig(serviceConfig)
      }))
    };
  },

  async getComposeServicePort(
    project: string,
    service: string,
    privatePort: number,
    protocol: "tcp" | "udp"
  ) {
    const result = await runCommand([
      ...composeCommandPrefix(project, config),
      "port",
      "--protocol",
      protocol,
      service,
      String(privatePort)
    ]);
    return {
      project,
      service,
      privatePort,
      protocol,
      publicPorts: combinedOutput(result)
        .split("\n")
        .map((port) => port.trim())
        .filter(Boolean)
    };
  },

  async listComposeServiceProcesses(project: string, services: string[]) {
    const result = await runCommand([
      ...composeCommandPrefix(project, config),
      "top",
      ...services
    ]);
    return { project, processes: combinedOutput(result) };
  },

  async listComposeServiceImages(project: string, services: string[]) {
    const { stdout } = await runCommand([
      ...composeCommandPrefix(project, config),
      "images",
      "--format",
      "json",
      ...services
    ]);
    const images = parseJson(stdout, "compose images");
    if (!Array.isArray(images)) {
      throw new Error("Docker compose images returned an unexpected response");
    }
    return { project, images };
  },

  async startContainer(container: string) {
    assertWriteToolsEnabled(config);
    assertContainerAllowed(container, config);
    const result = await runCommand(["container", "start", container]);
    return { container, output: combinedOutput(result) };
  },

  async restartContainer(container: string) {
    assertWriteToolsEnabled(config);
    assertContainerAllowed(container, config);
    const result = await runCommand(["container", "restart", container]);
    return { container, output: combinedOutput(result) };
  },

  async execContainer(container: string, command: string[]) {
    assertWriteToolsEnabled(config);
    assertContainerAllowed(container, config);
    const { stdout, stderr } = await runCommand([
      "container",
      "exec",
      container,
      ...command
    ]);
    return { stdout, stderr };
  },

  async upComposeProject(project: string, services: string[]) {
    assertWriteToolsEnabled(config);
    const result = await runCommand([
      ...composeCommandPrefix(project, config),
      "up",
      "--detach",
      ...services
    ]);
    return { project, output: combinedOutput(result) };
  },

  async downComposeProject(project: string, removeOrphans: boolean) {
    assertWriteToolsEnabled(config);
    const args = [...composeCommandPrefix(project, config), "down"];
    if (removeOrphans) {
      args.push("--remove-orphans");
    }
    const result = await runCommand(args);
    return { project, output: combinedOutput(result) };
  },

  async restartComposeServices(project: string, services: string[]) {
    assertWriteToolsEnabled(config);
    const result = await runCommand([
      ...composeCommandPrefix(project, config),
      "restart",
      ...services
    ]);
    return { project, output: combinedOutput(result) };
  },

  async execComposeService(project: string, service: string, command: string[]) {
    assertWriteToolsEnabled(config);
    const { stdout, stderr } = await runCommand([
      ...composeCommandPrefix(project, config),
      "exec",
      "--no-tty",
      service,
      ...command
    ]);
    return { stdout, stderr };
  },

  async pullComposeImages(project: string, services: string[]) {
    assertWriteToolsEnabled(config);
    const result = await runCommand([
      ...composeCommandPrefix(project, config),
      "pull",
      ...services
    ]);
    return { project, output: combinedOutput(result) };
  },

  async buildComposeServices(project: string, services: string[]) {
    assertWriteToolsEnabled(config);
    const result = await runCommand([
      ...composeCommandPrefix(project, config),
      "build",
      ...services
    ]);
    return { project, output: combinedOutput(result) };
  },

  async scaleComposeServices(
    project: string,
    replicas: Array<{ service: string; replicas: number }>
  ) {
    assertWriteToolsEnabled(config);
    const result = await runCommand([
      ...composeCommandPrefix(project, config),
      "scale",
      ...replicas.map(({ service, replicas: count }) => `${service}=${count}`)
    ]);
    return { project, output: combinedOutput(result) };
  },

  async startComposeServices(project: string, services: string[]) {
    assertWriteToolsEnabled(config);
    const result = await runCommand([
      ...composeCommandPrefix(project, config),
      "start",
      ...services
    ]);
    return { project, output: combinedOutput(result) };
  },

  async stopComposeServices(project: string, services: string[]) {
    assertWriteToolsEnabled(config);
    const result = await runCommand([
      ...composeCommandPrefix(project, config),
      "stop",
      ...services
    ]);
    return { project, output: combinedOutput(result) };
  },

  async pauseComposeServices(project: string, services: string[]) {
    assertWriteToolsEnabled(config);
    const result = await runCommand([
      ...composeCommandPrefix(project, config),
      "pause",
      ...services
    ]);
    return { project, output: combinedOutput(result) };
  },

  async unpauseComposeServices(project: string, services: string[]) {
    assertWriteToolsEnabled(config);
    const result = await runCommand([
      ...composeCommandPrefix(project, config),
      "unpause",
      ...services
    ]);
    return { project, output: combinedOutput(result) };
  }
});

export type DockerService = ReturnType<typeof createDockerService>;
