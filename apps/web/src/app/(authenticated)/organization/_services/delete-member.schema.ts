import z from "zod";

export const DeleteMemberSchema = z.object({
  memberId: z.string(),
});

export type DeleteMemberInput = z.infer<typeof DeleteMemberSchema>;
