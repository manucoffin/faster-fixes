import z from "zod";

export const ListDistinctPageUrlsSchema = z.object({
  projectId: z.string(),
});

export type ListDistinctPageUrlsInput = z.infer<
  typeof ListDistinctPageUrlsSchema
>;
