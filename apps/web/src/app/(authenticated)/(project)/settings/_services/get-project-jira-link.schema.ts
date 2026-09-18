import z from "zod";

export const GetProjectJiraLinkSchema = z.object({
  projectId: z.string(),
});

export type GetProjectJiraLinkInput = z.infer<typeof GetProjectJiraLinkSchema>;
