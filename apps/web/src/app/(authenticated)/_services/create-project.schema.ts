import z from "zod";

import { DomainSchema } from "@/app/_domains/project/_services/domain.schema";

export const CreateProjectSchema = z.object({
  organizationId: z.string(),
  name: z.string().trim().min(1, "Name is required"),
  domain: DomainSchema,
});

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
