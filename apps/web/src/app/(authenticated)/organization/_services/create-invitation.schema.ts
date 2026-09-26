import z from "zod";

export const CreateInvitationSchema = z.object({
  email: z.email("Invalid email address"),
  role: z.enum(["member", "admin"]).default("member"),
});

export type CreateInvitationInput = z.infer<typeof CreateInvitationSchema>;
