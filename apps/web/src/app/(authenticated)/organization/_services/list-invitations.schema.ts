import z from "zod";

export const ListInvitationsSchema = z.object({
  organizationId: z.string(),
});

export type ListInvitationsInput = z.infer<typeof ListInvitationsSchema>;
