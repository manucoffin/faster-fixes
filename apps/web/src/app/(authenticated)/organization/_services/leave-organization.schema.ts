import z from "zod";

export const LeaveOrganizationSchema = z.object({
  organizationId: z.string(),
});

export type LeaveOrganizationInput = z.infer<typeof LeaveOrganizationSchema>;
