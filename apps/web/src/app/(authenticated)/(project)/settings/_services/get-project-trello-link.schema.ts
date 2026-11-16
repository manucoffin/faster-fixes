import z from "zod";

export const GetProjectTrelloLinkSchema = z.object({
  projectId: z.string(),
});

export type GetProjectTrelloLinkInput = z.infer<
  typeof GetProjectTrelloLinkSchema
>;
