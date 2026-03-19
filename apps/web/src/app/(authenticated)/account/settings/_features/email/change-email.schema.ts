import z from "zod";

export const ChangeEmailSchema = z.object({
  newEmail: z
    .email("Please enter a valid email address")
    .trim()
    .toLowerCase(),
});

export type ChangeEmailInputs = z.infer<typeof ChangeEmailSchema>;
