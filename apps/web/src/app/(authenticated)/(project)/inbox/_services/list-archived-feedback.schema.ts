import z from "zod";

export const ListArchivedFeedbackSchema = z.object({
  projectId: z.string(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  sortBy: z.enum(["createdAt", "updatedAt"]).default("updatedAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// The four defaulted fields make the parsed input and the caller-facing input
// diverge, so both aliases are exported.
export type ListArchivedFeedbackInput = z.infer<
  typeof ListArchivedFeedbackSchema
>;
export type ListArchivedFeedbackValues = z.input<
  typeof ListArchivedFeedbackSchema
>;
