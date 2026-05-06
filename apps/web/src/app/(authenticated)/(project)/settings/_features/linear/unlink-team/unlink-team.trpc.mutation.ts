"use server";

import { protectedProcedure } from "@/server/trpc/trpc";
import { TRPCError, inferProcedureOutput } from "@trpc/server";
import { z } from "zod";

// Not plan-gated: downgraded users must always be able to unlink.
export const unlinkLinearTeam = protectedProcedure
  .input(z.object({ projectId: z.string() }))
  .mutation(async ({ input, ctx }) => {
    const { prisma, session } = ctx;

    const project = await prisma.project.findUnique({
      where: { id: input.projectId },
      select: { organizationId: true },
    });

    if (!project) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Project not found." });
    }

    const membership = await prisma.member.findFirst({
      where: {
        organizationId: project.organizationId,
        userId: session.user.id,
        role: { in: ["owner", "admin"] },
      },
    });

    if (!membership) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only owners and admins can unlink Linear teams.",
      });
    }

    await prisma.projectLinearLink.deleteMany({
      where: { projectId: input.projectId },
    });

    return { success: true };
  });

export type UnlinkLinearTeamOutput = inferProcedureOutput<
  typeof unlinkLinearTeam
>;
