import z from "zod";

export const LeaveOrganizationSchema = z.object({
  organizationId: z.string(),
});

export type LeaveOrganizationInputs = z.infer<typeof LeaveOrganizationSchema>;
