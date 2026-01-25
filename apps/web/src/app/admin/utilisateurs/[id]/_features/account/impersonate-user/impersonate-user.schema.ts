import { z } from "zod";

export const ImpersonateUserSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
});

export type ImpersonateUserInputs = z.infer<typeof ImpersonateUserSchema>;
