import z from "zod";

export const RejectInvitationSchema = z.object({
  invitationId: z.string(),
});

export type RejectInvitationInputs = z.infer<typeof RejectInvitationSchema>;
