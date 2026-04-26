import { z } from "zod";

export const FeedbackStatusEnum = z.enum([
  "new",
  "in_progress",
  "resolved",
  "closed",
]);

export const ListFeedbacksQuerySchema = z.object({
  status: FeedbackStatusEnum.optional(),
  page_url: z.url().optional(),
  project: z.string().min(1),
  format: z.enum(["json", "markdown"]).default("json"),
});

export const UpdateFeedbackStatusSchema = z.object({
  status: FeedbackStatusEnum,
});

export const FeedbackIdSchema = z.string().uuid();

const FeedbackItemSchema = z.object({
  comment: z.string().trim().min(1),
  pageUrl: z.url(),
  status: FeedbackStatusEnum.optional(),
  selector: z.string().optional(),
  clickX: z.number().optional(),
  clickY: z.number().optional(),
  browserName: z.string().optional(),
  browserVersion: z.string().optional(),
  os: z.string().optional(),
  viewportWidth: z.number().int().optional(),
  viewportHeight: z.number().int().optional(),
  // Preserve original timestamp from the source tool — useful for migrations.
  createdAt: z.iso.datetime().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const CreateFeedbacksSchema = z.object({
  project: z.string().min(1),
  reviewer_name: z.string().trim().min(1).max(100).optional(),
  // Free-form tag (e.g. "bugherd", "marker.io") stamped into each feedback's
  // metadata so migrated items remain traceable to their origin tool.
  source: z.string().trim().min(1).max(50).optional(),
  feedbacks: z.array(FeedbackItemSchema).min(1).max(100),
});
