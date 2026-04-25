import z from "zod";

import { DomainSchema } from "@/app/_features/project/normalize-domain";

export const CreateOnboardingProjectSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  domain: DomainSchema,
});

export type CreateOnboardingProjectInput = z.infer<
  typeof CreateOnboardingProjectSchema
>;
