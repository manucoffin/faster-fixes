import z from "zod";

export const UpdateOrganizationLogoSchema = z.object({
  organizationId: z.string(),
});

export type UpdateOrganizationLogoInput = z.infer<
  typeof UpdateOrganizationLogoSchema
>;
