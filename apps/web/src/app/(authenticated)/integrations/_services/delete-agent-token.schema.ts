import z from "zod";

export const DeleteAgentTokenSchema = z.object({
  organizationId: z.string(),
  tokenId: z.string(),
});

export type DeleteAgentTokenInput = z.infer<typeof DeleteAgentTokenSchema>;
