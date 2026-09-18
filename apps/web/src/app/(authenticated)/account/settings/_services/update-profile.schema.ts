import z from "zod";

export const UpdateProfileSchema = z.object({
  firstName: z.string().trim().optional(),
  lastName: z.string().trim().optional(),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
