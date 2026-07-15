import { z } from "zod";

export const createDockerToolSchemas = (
  maxLogLines: number,
  maxEventLookbackMinutes = 60
) => {
  const resourceName = z
    .string()
    .min(1)
    .max(255)
    .refine(
      (value) => !value.startsWith("-"),
      "Resource names must not start with a hyphen"
    );
  const container = resourceName;
  const composeIdentifier = z
    .string()
    .min(1)
    .max(255)
    .regex(
      /^[A-Za-z0-9][A-Za-z0-9_.-]*$/,
      "Compose identifiers may contain only letters, numbers, dot, underscore, and hyphen"
    );
  const services = z.array(composeIdentifier).max(32).optional();
  const composeScale = z
    .object({
      project: composeIdentifier,
      replicas: z
        .array(
          z.object({
            service: composeIdentifier,
            replicas: z.number().int().min(0).max(100)
          })
        )
        .min(1)
        .max(32)
    })
    .refine(
      ({ replicas }) =>
        new Set(replicas.map(({ service }) => service)).size === replicas.length,
      "Each Compose service may be scaled only once"
    );

  return {
    listContainers: z.object({ all: z.boolean().optional() }),
    container: z.object({ container }),
    logs: z.object({
      container,
      tail: z.number().int().min(1).max(maxLogLines).optional()
    }),
    composeServices: z.object({ project: composeIdentifier, services }),
    composeLogs: z.object({
      project: composeIdentifier,
      service: composeIdentifier.optional(),
      tail: z.number().int().min(1).max(maxLogLines).optional()
    }),
    composeProject: z.object({ project: composeIdentifier }),
    composeStats: z.object({
      project: composeIdentifier,
      service: composeIdentifier.optional()
    }),
    composeEvents: z.object({
      project: composeIdentifier,
      since_minutes: z
        .number()
        .int()
        .min(1)
        .max(maxEventLookbackMinutes)
        .optional()
    }),
    composeHealth: z.object({ project: composeIdentifier, services }),
    composeDependencies: z.object({
      project: composeIdentifier,
      service: composeIdentifier.optional()
    }),
    containerStats: z.object({
      containers: z.array(container).max(100).optional()
    }),
    resource: z.object({ name: resourceName }),
    composePort: z.object({
      project: composeIdentifier,
      service: composeIdentifier,
      private_port: z.number().int().min(1).max(65_535),
      protocol: z.enum(["tcp", "udp"]).optional()
    }),
    composeScale,
    composeDown: z.object({
      project: composeIdentifier,
      remove_orphans: z.boolean().optional()
    }),
    composeExec: z.object({
      project: composeIdentifier,
      service: composeIdentifier,
      command: z
        .array(z.string().min(1).max(4_096))
        .min(1)
        .max(32)
    }),
    exec: z.object({
      container,
      command: z
        .array(z.string().min(1).max(4_096))
        .min(1)
        .max(32)
    })
  };
};
