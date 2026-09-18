import z from "zod";

export const DeleteInvitationSchema = z.object({
  invitationId: z.string(),
});

export type DeleteInvitationInput = z.infer<typeof DeleteInvitationSchema>;
