import { z } from "zod";

export const searchShortcutsParameters = z.object({
  query: z.string().min(1).max(300),
  category: z.string().min(1).optional(),
  platform: z.enum(["mac", "win"]).optional(),
  limit: z.number().int().min(1).max(25).optional()
});

export type SearchShortcutsParameters = z.infer<
  typeof searchShortcutsParameters
>;
