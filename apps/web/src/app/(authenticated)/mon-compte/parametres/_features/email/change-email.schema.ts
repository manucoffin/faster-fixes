import z from "zod";

export const ChangeEmailSchema = z.object({
  newEmail: z
    .email("Veuillez entrer une adresse email valide")
    .trim()
    .toLowerCase(),
});

export type ChangeEmailInputs = z.infer<typeof ChangeEmailSchema>;
