import { z } from "zod";

// `pending` as a target is the unpublish action.
export const UpdateTestimonialStatusSchema = z.object({
  testimonialId: z.string().min(1),
  status: z.enum(["pending", "published", "rejected"]),
});

export type UpdateTestimonialStatusInput = z.infer<
  typeof UpdateTestimonialStatusSchema
>;
