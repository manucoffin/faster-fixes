import { z } from "zod";

export const FeedbackStatusEnum = z.enum([
  "new",
  "in_progress",
  "resolved",
  "closed",
]);

export const FeedbackItemSchema = z.object({
  comment: z.string().min(1).describe("The feedback comment / bug description"),
  pageUrl: z
    .string()
    .url()
    .describe("Page URL where the feedback was originally left"),
  status: FeedbackStatusEnum.optional().describe(
    "Initial status. Defaults to 'new'",
  ),
  selector: z
    .string()
    .optional()
    .describe("CSS selector of the targeted element"),
  clickX: z.number().optional().describe("Click X coordinate (px)"),
  clickY: z.number().optional().describe("Click Y coordinate (px)"),
  browserName: z.string().optional(),
  browserVersion: z.string().optional(),
  os: z.string().optional(),
  viewportWidth: z.number().int().optional(),
  viewportHeight: z.number().int().optional(),
  createdAt: z
    .string()
    .datetime()
    .optional()
    .describe(
      "Original creation timestamp (ISO 8601). Preserves dates when migrating from another tool",
    ),
  metadata: z
    .record(z.string(), z.any())
    .optional()
    .describe(
      "Arbitrary key/value pairs from the source tool (e.g. originalId, tags)",
    ),
});
