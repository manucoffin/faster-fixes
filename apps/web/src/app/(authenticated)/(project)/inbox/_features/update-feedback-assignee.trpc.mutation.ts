"use server";

import { protectedProcedure } from "@/server/trpc/trpc";
import { TRPCError } from "@trpc/server";
import { UpdateFeedbackAssigneeSchema } from "./update-feedback-assignee.schema";

export const updateFeedbackAssignee = protectedProcedure
  .input(UpdateFeedbackAssigneeSchema)
  .mutation(async ({ input, ctx }) => {
    const { prisma, session } = ctx;

    const feedback = await prisma.feedback.findUnique({
      where: { id: input.feedbackId },
      include: { project: { select: { organizationId: true } } },
    });

    if (!feedback) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Feedback not found." });
    }

    const membership = await prisma.member.findFirst({
      where: {
        organizationId: feedback.project.organizationId,
        userId: session.user.id,
      },
    });

    if (!membership) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Access denied." });
    }

    if (input.assigneeId) {
      const assignee = await prisma.member.findFirst({
        where: {
          id: input.assigneeId,
          organizationId: feedback.project.organizationId,
        },
      });

      if (!assignee) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Member not found." });
      }
    }

    await prisma.feedback.update({
      where: { id: input.feedbackId },
      data: { assigneeId: input.assigneeId },
    });

    return { id: input.feedbackId };
  });
