"use server";

import { protectedProcedure } from "@/server/trpc/trpc";
import { inferProcedureOutput, TRPCError } from "@trpc/server";
import { DeleteMemberSchema } from "./delete-member.schema";

export const deleteMember = protectedProcedure
  .input(DeleteMemberSchema)
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
        role: { in: ["owner", "admin"] },
      },
    });

    if (!currentUserMembership) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message:
          "Vous n'avez pas les permissions pour retirer ce membre.",
      });
    }

    if (member.role === "owner") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Impossible de retirer le propriétaire de l'organisation.",
      });
    }

    await prisma.member.delete({
      where: { id: input.memberId },
    });

    return { success: true };
  });

export type DeleteMemberOutput = inferProcedureOutput<typeof deleteMember>;
