"use server";

import { deleteAsset } from "@/server/storage/delete-asset";
import { protectedProcedure } from "@/server/trpc/trpc";
import { TRPCError } from "@trpc/server";
import z from "zod";

export const bulkHardDeleteFeedback = protectedProcedure
  .input(z.object({ feedbackIds: z.array(z.string()).min(1) }))
  .mutation(async ({ input, ctx }) => {
    const { prisma, session } = ctx;

    const feedbackItems = await prisma.feedback.findMany({
      where: { id: { in: input.feedbackIds } },
      include: { project: { select: { organizationId: true } } },
    });

    if (feedbackItems.length === 0) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Feedback not found." });
    }

    const nonClosed = feedbackItems.find((f) => f.status !== "closed");
    if (nonClosed) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Only archived feedback can be permanently deleted.",
      });
    }

    const firstItem = feedbackItems[0]!;

    const membership = await prisma.member.findFirst({
      where: {
        organizationId: firstItem.project.organizationId,
        userId: session.user.id,
      },
    });

    if (!membership) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Access denied." });
    }

    const screenshotIds = feedbackItems
      .map((f) => f.screenshotId)
      .filter((id): id is string => id !== null);

    await Promise.all(screenshotIds.map((id) => deleteAsset(id)));

    await prisma.feedback.deleteMany({
      where: { id: { in: input.feedbackIds } },
    });

    return { count: input.feedbackIds.length };
  });
