import { z } from "zod";

export const schemaParameter = z.object({
  schema: z.string().min(1).optional()
});

export const tableParameter = z.object({
  schema: z.string().min(1).optional(),
  table_name: z.string().min(1)
});

export const queryParameter = z.object({
  sql: z.string().min(1)
});

export const writeQueryParameter = z.object({
  sql: z.string().min(1)
});

export const activityParameter = z.object({
  limit: z.number().int().min(1).max(100).optional()
});

export const schemaActivityParameter = activityParameter.extend({
  schema: z.string().min(1).optional()
});

export type SchemaParameter = z.infer<typeof schemaParameter>;
export type TableParameter = z.infer<typeof tableParameter>;
export type QueryParameter = z.infer<typeof queryParameter>;
export type WriteQueryParameter = z.infer<typeof writeQueryParameter>;
export type ActivityParameter = z.infer<typeof activityParameter>;
export type SchemaActivityParameter = z.infer<typeof schemaActivityParameter>;
