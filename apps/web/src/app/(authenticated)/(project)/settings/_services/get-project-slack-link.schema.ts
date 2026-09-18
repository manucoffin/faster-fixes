import z from "zod";

export const GetProjectSlackLinkSchema = z.object({
  projectId: z.string(),
});

export type GetProjectSlackLinkInput = z.infer<
  typeof GetProjectSlackLinkSchema
>;
