import z from "zod";

export const GetProjectLinearLinkSchema = z.object({
  projectId: z.string(),
});

export type GetProjectLinearLinkInput = z.infer<
  typeof GetProjectLinearLinkSchema
>;
