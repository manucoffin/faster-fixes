"use server";

import { protectedProcedure } from "@/server/trpc/trpc";
import { TRPCError } from "@trpc/server";
import { LeaveOrganizationSchema } from "./leave-organization.schema";

export const leaveOrganization = protectedProcedure
  .input(LeaveOrganizationSchema)
  .mutation(async ({ input, ctx }) => {
    const { prisma, session } = ctx;

    const membership = await prisma.member.findFirst({
      where: {
        organizationId: input.organizationId,
        userId: session.user.id,
      },
    });

    if (!membership) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Vous n'êtes pas membre de cette organisation.",
      });
    }

    if (membership.role === "owner") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message:
          "Le propriétaire ne peut pas quitter l'organisation. Transférez la propriété ou supprimez l'organisation.",
      });
    }

    await prisma.member.delete({
      where: { id: membership.id },
    });

    return { success: true };
  });
