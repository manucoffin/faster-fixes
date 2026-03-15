import z from "zod";

export const DeleteAccountSchema = z.object({
  password: z.string().min(1, "Password is required to confirm deletion"),
});

export type DeleteAccountInputs = z.infer<typeof DeleteAccountSchema>;
