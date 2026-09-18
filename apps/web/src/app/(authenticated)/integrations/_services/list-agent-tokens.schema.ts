import z from "zod";

export const ListAgentTokensSchema = z.object({
  organizationId: z.string(),
});

export type ListAgentTokensInput = z.infer<typeof ListAgentTokensSchema>;
