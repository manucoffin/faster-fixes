import z from "zod";

export const CreateOnboardingProjectSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  url: z.url("URL must be valid (e.g. https://client.com)"),
});

export type CreateOnboardingProjectInput = z.infer<
  typeof CreateOnboardingProjectSchema
>;
