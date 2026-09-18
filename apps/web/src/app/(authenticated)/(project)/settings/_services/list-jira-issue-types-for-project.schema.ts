import z from "zod";

export const ListJiraIssueTypesForProjectSchema = z.object({
  projectId: z.string(),
  jiraProjectId: z.string(),
});

export type ListJiraIssueTypesForProjectInput = z.infer<
  typeof ListJiraIssueTypesForProjectSchema
>;
