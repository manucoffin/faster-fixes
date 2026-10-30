import { z } from "zod";

// Canonical Testimonial request statuses (CONTEXT.md). The DB column is a
// free-form String, so this Zod enum is the only runtime validator.
export const TestimonialRequestStatusEnum = z.enum([
  "pending",
  "submitted",
  "declined",
  "expired",
]);
