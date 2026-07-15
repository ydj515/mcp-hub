export type DockerConfig = {
  enableWriteTools: boolean;
  allowedContainers: string[] | undefined;
  allowedNetworks: string[] | undefined;
  allowedVolumes: string[] | undefined;
  composeProjects: Record<string, string>;
  maxComposeContainers: number;
  eventsLookbackMinutes: number;
  maxEventLookbackMinutes: number;
  maxLogLines: number;
  maxOutputBytes: number;
  commandTimeoutMs: number;
};

const parsePositiveInteger = (
  value: string | undefined,
  fallback: number,
  name: string
) => {
  if (value === undefined) {
    return fallback;
  }

  if (!/^\d+$/.test(value)) {
    throw new Error(`${name} must be a positive integer`);
  }

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }

  return parsed;
};

const parseBoolean = (value: string | undefined, name: string) => {
  if (value === undefined || value.trim() === "" || value === "false") {
    return false;
  }
  if (value === "true") {
    return true;
  }
  throw new Error(`${name} must be true or false`);
};

const parseAllowedResources = (
  value: string | undefined,
  name: string,
  resource: string
) => {
  if (value === undefined || value.trim() === "") {
    return undefined;
  }

  const containers = value
    .split(",")
    .map((container) => container.trim())
    .filter(Boolean);

  if (!containers.length) {
    throw new Error(`${name} must include at least one ${resource}`);
  }

  return containers;
};

const parseComposeProjects = (value: string | undefined) => {
  if (value === undefined || value.trim() === "") {
    return {};
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error("DOCKER_COMPOSE_PROJECTS must be a JSON object");
  }

  if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
    throw new Error("DOCKER_COMPOSE_PROJECTS must be a JSON object");
  }

  return Object.fromEntries(
    Object.entries(parsed).map(([project, directory]) => {
      if (!project.trim() || typeof directory !== "string" || !directory.trim()) {
        throw new Error(
          "DOCKER_COMPOSE_PROJECTS values must be non-empty directories"
        );
      }
      return [project, directory.trim()];
    })
  );
};

export const loadDockerConfig = (env: NodeJS.ProcessEnv): DockerConfig => {
  const maxEventLookbackMinutes = parsePositiveInteger(
    env.DOCKER_MAX_EVENT_LOOKBACK_MINUTES,
    60,
    "DOCKER_MAX_EVENT_LOOKBACK_MINUTES"
  );
  const eventsLookbackMinutes = parsePositiveInteger(
    env.DOCKER_EVENTS_LOOKBACK_MINUTES,
    15,
    "DOCKER_EVENTS_LOOKBACK_MINUTES"
  );
  if (eventsLookbackMinutes > maxEventLookbackMinutes) {
    throw new Error(
      "DOCKER_EVENTS_LOOKBACK_MINUTES must not exceed DOCKER_MAX_EVENT_LOOKBACK_MINUTES"
    );
  }

  return {
    enableWriteTools: parseBoolean(
      env.DOCKER_ENABLE_WRITE_TOOLS,
      "DOCKER_ENABLE_WRITE_TOOLS"
    ),
    allowedContainers: parseAllowedResources(
      env.DOCKER_ALLOWED_CONTAINERS,
      "DOCKER_ALLOWED_CONTAINERS",
      "container"
    ),
    allowedNetworks: parseAllowedResources(
      env.DOCKER_ALLOWED_NETWORKS,
      "DOCKER_ALLOWED_NETWORKS",
      "network"
    ),
    allowedVolumes: parseAllowedResources(
      env.DOCKER_ALLOWED_VOLUMES,
      "DOCKER_ALLOWED_VOLUMES",
      "volume"
    ),
    composeProjects: parseComposeProjects(env.DOCKER_COMPOSE_PROJECTS),
    maxComposeContainers: parsePositiveInteger(
      env.DOCKER_MAX_COMPOSE_CONTAINERS,
      100,
      "DOCKER_MAX_COMPOSE_CONTAINERS"
    ),
    eventsLookbackMinutes,
    maxEventLookbackMinutes,
    maxLogLines: parsePositiveInteger(
      env.DOCKER_MAX_LOG_LINES,
      500,
      "DOCKER_MAX_LOG_LINES"
    ),
    maxOutputBytes: parsePositiveInteger(
      env.DOCKER_MAX_OUTPUT_BYTES,
      1_048_576,
      "DOCKER_MAX_OUTPUT_BYTES"
    ),
    commandTimeoutMs: parsePositiveInteger(
      env.DOCKER_COMMAND_TIMEOUT_MS,
      10_000,
      "DOCKER_COMMAND_TIMEOUT_MS"
    )
  };
};
