import z from "zod";

export const GetOrganizationDetailsSchema = z.object({
  organizationId: z.string(),
});

export type GetOrganizationDetailsInput = z.infer<
  typeof GetOrganizationDetailsSchema
>;
