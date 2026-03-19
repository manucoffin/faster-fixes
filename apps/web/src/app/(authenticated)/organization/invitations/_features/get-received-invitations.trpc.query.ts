"use server";

import { protectedProcedure } from "@/server/trpc/trpc";
import { inferProcedureOutput } from "@trpc/server";

export const getReceivedInvitations = protectedProcedure.query(
  async ({ ctx }) => {
    const { prisma, session } = ctx;

    const invitations = await prisma.invitation.findMany({
      where: {
        email: session.user.email,
        status: "pending",
      },
      include: {
        organization: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return invitations;
  },
);

export type GetReceivedInvitationsOutput = inferProcedureOutput<
  typeof getReceivedInvitations
>;
