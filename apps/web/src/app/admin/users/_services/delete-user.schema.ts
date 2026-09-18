import { z } from "zod";

export const DeleteUserSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
});

export type DeleteUserInput = z.infer<typeof DeleteUserSchema>;
