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

// The Statuses a Video's open Feedback count covers, on the Videos list and
// the agent API alike.
export const OPEN_FEEDBACK_STATUSES = ["new", "in_progress"] satisfies Array<
  z.infer<typeof FeedbackStatusEnum>
>;
