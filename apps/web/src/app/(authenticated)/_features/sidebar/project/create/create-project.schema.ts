import z from "zod";

import { DomainSchema } from "@/app/_features/project/normalize-domain";

export const CreateProjectSchema = z.object({
  organizationId: z.string(),
  name: z.string().trim().min(1, "Name is required"),
  domain: DomainSchema,
});

export type CreateProjectInputs = z.infer<typeof CreateProjectSchema>;
