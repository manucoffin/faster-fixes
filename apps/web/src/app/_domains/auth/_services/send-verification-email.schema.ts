import { z } from "zod";

export const SendVerificationEmailSchema = z.object({
  email: z.email({ message: "Please enter a valid email address." }),
});

export type SendVerificationEmailInput = z.infer<
  typeof SendVerificationEmailSchema
>;
