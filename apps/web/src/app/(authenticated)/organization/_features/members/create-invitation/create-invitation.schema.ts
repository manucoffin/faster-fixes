import z from "zod";

export const CreateInvitationSchema = z.object({
  organizationId: z.string(),
  email: z.string().email("Adresse email invalide"),
  role: z.enum(["member", "admin"]).default("member"),
});

export type CreateInvitationInputs = z.infer<typeof CreateInvitationSchema>;
