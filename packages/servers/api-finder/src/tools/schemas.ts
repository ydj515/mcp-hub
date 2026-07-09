import { z } from "zod";

export const searchParameters = z.object({
  service_description: z.string().min(1),
  keywords: z.array(z.string().min(1)).min(1),
});

export const detailsParameters = z.object({
  api_id: z.string().min(1),
});

export type SearchParameters = z.infer<typeof searchParameters>;
export type DetailsParameters = z.infer<typeof detailsParameters>;
