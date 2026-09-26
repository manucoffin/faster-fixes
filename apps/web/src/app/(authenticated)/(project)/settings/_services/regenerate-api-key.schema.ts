import z from "zod";

export const RegenerateApiKeySchema = z.object({
  projectId: z.string(),
});

export type RegenerateApiKeyInput = z.infer<typeof RegenerateApiKeySchema>;
