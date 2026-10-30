import { z } from "zod";

// The private token carried by the Testimonial request links. Every public
// testimonial procedure takes it, and the rate limit is scoped to it.
export const TestimonialTokenSchema = z.object({
  token: z.string().min(1).max(200),
});

export type TestimonialTokenInput = z.infer<typeof TestimonialTokenSchema>;
