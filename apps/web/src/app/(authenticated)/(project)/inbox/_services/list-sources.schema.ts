import z from "zod";

export const ListSourcesSchema = z.object({
  projectId: z.string(),
});

export type ListSourcesInput = z.infer<typeof ListSourcesSchema>;
