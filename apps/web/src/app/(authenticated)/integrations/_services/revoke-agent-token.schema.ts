import z from "zod";

export const RevokeAgentTokenSchema = z.object({
  organizationId: z.string(),
  tokenId: z.string(),
});

export type RevokeAgentTokenInput = z.infer<typeof RevokeAgentTokenSchema>;
