import z from "zod";

export const GetInvitationsSchema = z.object({
  organizationId: z.string(),
});

export type GetInvitationsInputs = z.infer<typeof GetInvitationsSchema>;
