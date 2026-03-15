import z from "zod";

export const UpdateMemberRoleSchema = z.object({
  memberId: z.string(),
  role: z.enum(["member", "admin"]),
});

export type UpdateMemberRoleInputs = z.infer<typeof UpdateMemberRoleSchema>;
