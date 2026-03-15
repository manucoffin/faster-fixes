import z from "zod";

export const DeleteMemberSchema = z.object({
  memberId: z.string(),
});

export type DeleteMemberInputs = z.infer<typeof DeleteMemberSchema>;
