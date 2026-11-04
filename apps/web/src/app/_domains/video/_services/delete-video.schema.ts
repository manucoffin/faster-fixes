import { z } from "zod";

export const DeleteVideoSchema = z.object({
  videoId: z.string().min(1),
});

export type DeleteVideoInput = z.infer<typeof DeleteVideoSchema>;
