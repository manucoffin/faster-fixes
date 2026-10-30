import { z } from "zod";

// Canonical Testimonial statuses (CONTEXT.md). The DB column is a free-form
// String, so this Zod enum is the only runtime validator.
export const TestimonialStatusEnum = z.enum([
  "pending",
  "published",
  "rejected",
]);
