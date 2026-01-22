import z from "zod";

export const DeleteAccountSchema = z.object({
  password: z.string().min(1, "Le mot de passe est requis pour confirmer la suppression"),
});

export type DeleteAccountInputs = z.infer<typeof DeleteAccountSchema>;
