"use server";

import { protectedProcedure } from "@/server/trpc/trpc";
import { inferProcedureOutput, TRPCError } from "@trpc/server";
import { UpdateMemberRoleSchema } from "./update-member-role.schema";

export const updateMemberRole = protectedProcedure
  .input(UpdateMemberRoleSchema)
  .mutation(async ({ input, ctx }) => {
    const { prisma, session } = ctx;

    const member = await prisma.member.findFirst({
      where: { id: input.memberId },
    });

    if (!member) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Membre introuvable.",
      });
    }

    const currentUserMembership = await prisma.member.findFirst({
      where: {
        organizationId: member.organizationId,
        userId: session.user.id,
        role: "owner",
      },
    });

    if (!currentUserMembership) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message:
          "Seul le propriétaire peut modifier les rôles des membres.",
      });
    }

    const updated = await prisma.member.update({
      where: { id: input.memberId },
      data: { role: input.role },
    });

    return { id: updated.id, role: updated.role };
  });

export type UpdateMemberRoleOutput = inferProcedureOutput<
  typeof updateMemberRole
>;
