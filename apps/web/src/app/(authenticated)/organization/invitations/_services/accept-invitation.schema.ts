import z from "zod";

export const AcceptInvitationSchema = z.object({
  invitationId: z.string(),
});

export type AcceptInvitationInput = z.infer<typeof AcceptInvitationSchema>;
