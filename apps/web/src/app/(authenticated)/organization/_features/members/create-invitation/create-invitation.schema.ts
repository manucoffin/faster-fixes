import z from "zod";

export const CreateInvitationSchema = z.object({
  organizationId: z.string(),
  email: z.string().email("Invalid email address"),
  role: z.enum(["member", "admin"]).default("member"),
});

export type CreateInvitationInputs = z.infer<typeof CreateInvitationSchema>;
