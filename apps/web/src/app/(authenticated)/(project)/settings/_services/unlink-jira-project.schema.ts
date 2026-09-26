import z from "zod";

export const UnlinkJiraProjectSchema = z.object({
  projectId: z.string(),
});

export type UnlinkJiraProjectInput = z.infer<typeof UnlinkJiraProjectSchema>;
