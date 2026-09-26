import { z } from "zod";

export const UpdateProjectGitHubLinkSchema = z.object({
  projectId: z.string(),
  autoCreateIssues: z.boolean().optional(),
  defaultLabels: z.array(z.string()).optional(),
});

export type UpdateProjectGitHubLinkInput = z.infer<
  typeof UpdateProjectGitHubLinkSchema
>;
