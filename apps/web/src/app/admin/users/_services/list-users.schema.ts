import { z } from "zod";

export const ListUsersSchema = z.object({
  search: z.string().optional(),
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(10),
  sortBy: z.enum(["name", "email", "createdAt", "feedbackCount"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

export type ListUsersInput = z.infer<typeof ListUsersSchema>;

// `page` and `pageSize` carry a default, so the caller may omit them.
export type ListUsersValues = z.input<typeof ListUsersSchema>;
