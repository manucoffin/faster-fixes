"use server";

import { protectedProcedure } from "@/server/trpc/trpc";
import { TRPCError } from "@trpc/server";
import z from "zod";

export const bulkUpdateFeedbackStatus = protectedProcedure
  .input(
    z.object({
      feedbackIds: z.array(z.string()).min(1),
      status: z.enum(["new", "in_progress", "resolved", "closed"]),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const { prisma, session } = ctx;

    const firstFeedback = await prisma.feedback.findUnique({
      where: { id: input.feedbackIds[0] },
      include: { project: { select: { organizationId: true } } },
    });

    if (!firstFeedback) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Feedback not found." });
    }

    const membership = await prisma.member.findFirst({
      where: {
        organizationId: firstFeedback.project.organizationId,
        userId: session.user.id,
      },
    });

    if (!membership) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Access denied." });
    }

    await prisma.feedback.updateMany({
      where: { id: { in: input.feedbackIds } },
      data: { status: input.status },
    });

    return { count: input.feedbackIds.length };
  });
