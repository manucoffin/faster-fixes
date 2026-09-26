import z from "zod";

export const RejectInvitationSchema = z.object({
  invitationId: z.string(),
});

export type RejectInvitationInput = z.infer<typeof RejectInvitationSchema>;
