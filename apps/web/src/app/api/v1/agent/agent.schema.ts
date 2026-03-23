import { z } from "zod";

export const FeedbackStatusEnum = z.enum([
  "new",
  "in_progress",
  "resolved",
  "closed",
]);

export const ListFeedbacksQuerySchema = z.object({
  status: FeedbackStatusEnum.optional(),
  page_url: z.string().url().optional(),
  project: z.string().min(1),
  format: z.enum(["json", "markdown"]).default("json"),
});

export const UpdateFeedbackStatusSchema = z.object({
  status: FeedbackStatusEnum,
});

export const FeedbackIdSchema = z.string().uuid();
