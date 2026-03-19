import z from "zod";

export const AcceptInvitationSchema = z.object({
  invitationId: z.string(),
});

export type AcceptInvitationInputs = z.infer<typeof AcceptInvitationSchema>;
