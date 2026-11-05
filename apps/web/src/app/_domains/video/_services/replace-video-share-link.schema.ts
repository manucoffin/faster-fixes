import { z } from "zod";

export const ReplaceVideoShareLinkSchema = z.object({
  videoId: z.string().min(1),
});

export type ReplaceVideoShareLinkInput = z.infer<
  typeof ReplaceVideoShareLinkSchema
>;
