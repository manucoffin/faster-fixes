import { z } from "zod";

export const UpdateProjectSlackLinkSchema = z.object({
  projectId: z.string(),
  enabled: z.boolean(),
});

export type UpdateProjectSlackLinkInput = z.infer<
  typeof UpdateProjectSlackLinkSchema
>;
