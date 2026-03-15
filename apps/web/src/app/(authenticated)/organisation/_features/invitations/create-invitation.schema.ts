import z from "zod";

export const CreateInvitationSchema = z.object({
  email: z.string().email("Adresse email invalide"),
  role: z.enum(["admin", "member"], {
    message: "Le rôle est requis",
  }),
});

export type CreateInvitationInputs = z.infer<typeof CreateInvitationSchema>;
