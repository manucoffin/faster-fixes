"use server";

import { protectedProcedure } from "@/server/trpc/trpc";
import { inferProcedureOutput, TRPCError } from "@trpc/server";
import { DeleteInvitationSchema } from "./delete-invitation.schema";

export const deleteInvitation = protectedProcedure
  .input(DeleteInvitationSchema)
  .mutation(async ({ input, ctx }) => {
    const { prisma, session } = ctx;

    const invitation = await prisma.invitation.findFirst({
      where: { id: input.invitationId },
    });

    if (!invitation) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Invitation introuvable.",
      });
    }

    const membership = await prisma.member.findFirst({
      where: {
        organizationId: invitation.organizationId,
        userId: session.user.id,
        role: { in: ["owner", "admin"] },
      },
    });

    if (!membership) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message:
          "Vous n'avez pas les permissions pour annuler cette invitation.",
      });
    }

    await prisma.invitation.update({
      where: { id: input.invitationId },
      data: { status: "canceled" },
    });

    return { success: true };
  });

export type DeleteInvitationOutput = inferProcedureOutput<
  typeof deleteInvitation
>;
