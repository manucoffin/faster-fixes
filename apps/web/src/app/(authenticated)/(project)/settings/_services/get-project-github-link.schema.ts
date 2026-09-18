import z from "zod";

export const GetProjectGitHubLinkSchema = z.object({
  projectId: z.string(),
});

export type GetProjectGitHubLinkInput = z.infer<
  typeof GetProjectGitHubLinkSchema
>;
