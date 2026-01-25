import { z } from "zod";

export const SendVerificationEmailSchema = z.object({
  email: z.email({ message: "Veuillez saisir une adresse e-mail valide." }),
});

export type SendVerificationEmailInputs = z.infer<
  typeof SendVerificationEmailSchema
>;
