"use server";

import { protectedProcedure } from "@/server/trpc/trpc";
import { TRPCError, inferProcedureOutput } from "@trpc/server";
import z from "zod";

export const revokeReviewer = protectedProcedure
  .input(z.object({ reviewerId: z.string() }))
  .mutation(async ({ input, ctx }) => {
    const { prisma, session } = ctx;

    const reviewer = await prisma.reviewer.findUnique({
      where: { id: input.reviewerId },
      include: { project: true },
    });

    if (!reviewer) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Reviewer not found." });
    }

    const membership = await prisma.member.findFirst({
      where: {
        organizationId: reviewer.project.organizationId,
        userId: session.user.id,
        role: { in: ["owner", "admin"] },
      },
    });

    if (!membership) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Access denied." });
    }

    await prisma.reviewer.update({
      where: { id: input.reviewerId },
      data: { isActive: false },
    });

    return { id: input.reviewerId };
  });

export type RevokeReviewerOutput = inferProcedureOutput<typeof revokeReviewer>;
