import { z } from "zod";

export const ListUsersForExportSchema = z.object({
  search: z.string().optional(),
});

export type ListUsersForExportInput = z.infer<typeof ListUsersForExportSchema>;
