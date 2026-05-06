import { z } from "zod";

// Canonical feedback statuses. The literal "closed" is rendered as "Archived"
// in the UI; see CONTEXT.md for the glossary. The DB column is a free-form
// String, so this Zod enum is the only runtime validator.
export const FeedbackStatusEnum = z.enum([
  "new",
  "in_progress",
  "resolved",
  "closed",
]);

export type FeedbackStatus = z.infer<typeof FeedbackStatusEnum>;
