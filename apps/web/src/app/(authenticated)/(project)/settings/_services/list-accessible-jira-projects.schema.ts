import z from "zod";

export const ListAccessibleJiraProjectsSchema = z.object({
  projectId: z.string(),
});

export type ListAccessibleJiraProjectsInput = z.infer<
  typeof ListAccessibleJiraProjectsSchema
>;
