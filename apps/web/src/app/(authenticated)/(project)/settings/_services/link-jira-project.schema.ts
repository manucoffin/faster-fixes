import { z } from "zod";

// Jira rejects labels containing whitespace at issue-creation time, which would
// surface as an opaque mirroring failure long after the link was saved. Validate
// at the edge instead so the settings form reports it inline.
export const JiraLabelSchema = z
  .string()
  .min(1, "Labels cannot be empty.")
  .regex(/^\S+$/, "Labels cannot contain spaces.");

export const LinkJiraProjectSchema = z.object({
  projectId: z.string(),
  jiraProjectId: z.string().min(1, "Select a Jira project."),
  jiraProjectKey: z.string().min(1),
  jiraProjectName: z.string().min(1),
  issueTypeId: z.string().min(1, "Select an issue type."),
  issueTypeName: z.string().min(1),
  autoCreateIssues: z.boolean(),
  defaultLabels: z.array(JiraLabelSchema),
});

export type LinkJiraProjectInput = z.infer<typeof LinkJiraProjectSchema>;
