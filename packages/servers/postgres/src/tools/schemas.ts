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

export type SchemaParameter = z.infer<typeof schemaParameter>;
export type TableParameter = z.infer<typeof tableParameter>;
export type QueryParameter = z.infer<typeof queryParameter>;
