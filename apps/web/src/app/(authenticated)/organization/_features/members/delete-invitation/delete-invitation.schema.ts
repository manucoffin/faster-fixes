import z from "zod";

export const DeleteInvitationSchema = z.object({
  invitationId: z.string(),
});

export type DeleteInvitationInputs = z.infer<typeof DeleteInvitationSchema>;
