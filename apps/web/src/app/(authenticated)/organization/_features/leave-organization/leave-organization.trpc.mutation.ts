"use server";

import { protectedProcedure } from "@/server/trpc/trpc";
import { inferProcedureOutput, TRPCError } from "@trpc/server";
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
        message: "You are not a member of this organization.",
      });
    }

    if (membership.role === "owner") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message:
          "The owner cannot leave the organization. Transfer ownership or delete the organization.",
      });
    }

    await prisma.member.delete({
      where: { id: membership.id },
    });

    return { success: true };
  });

export type LeaveOrganizationOutput = inferProcedureOutput<
  typeof leaveOrganization
>;
