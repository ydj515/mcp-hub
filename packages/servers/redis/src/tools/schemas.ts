import { z } from "zod";

export const createRedisToolSchemas = (maxResults: number) => {
  const count = z.number().int().min(1).max(maxResults).optional();
  const key = z.string().min(1);
  const rangeWithinLimit = (start: number, end: number) =>
    Math.abs(end - start) + 1 <= maxResults;

  return {
    scanKeys: z.object({
      cursor: z.string().min(1).optional(),
      match: z.string().min(1).optional(),
      type: z.enum(["string", "hash", "list", "set", "zset", "stream"]).optional(),
      count
    }),
    key: z.object({ key }),
    collectionScan: z.object({
      key,
      cursor: z.string().min(1).optional(),
      match: z.string().min(1).optional(),
      count
    }),
    list: z.object({
      key,
      start: z.number().int(),
      end: z.number().int()
    }).refine(
      ({ start, end }) => rangeWithinLimit(start, end),
      "Requested range exceeds REDIS_MAX_RESULTS"
    ),
    sortedSet: z.object({
      key,
      start: z.number().int(),
      stop: z.number().int(),
      reverse: z.boolean().optional()
    }).refine(
      ({ start, stop }) => rangeWithinLimit(start, stop),
      "Requested range exceeds REDIS_MAX_RESULTS"
    ),
    stream: z.object({
      key,
      start: z.string().min(1).optional(),
      end: z.string().min(1).optional(),
      count
    }),
    serverInfo: z.object({ section: z.string().min(1).optional() }),
    clientList: z.object({
      type: z.enum(["normal", "master", "replica", "pubsub"]).optional()
    }),
    slowlog: z.object({ count })
  };
};
