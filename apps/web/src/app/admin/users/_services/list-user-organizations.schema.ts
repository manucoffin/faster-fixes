import { z } from "zod";

export const ListUserOrganizationsSchema = z.object({
  userId: z.string().min(1),
});

export type ListUserOrganizationsInput = z.infer<
  typeof ListUserOrganizationsSchema
>;
