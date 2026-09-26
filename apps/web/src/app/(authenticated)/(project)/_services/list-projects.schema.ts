import z from "zod";

export const ListProjectsSchema = z.object({
  organizationId: z.string(),
});

export type ListProjectsInput = z.infer<typeof ListProjectsSchema>;
