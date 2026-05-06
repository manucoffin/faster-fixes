"use server";

import { inngest } from "@/server/inngest";
import { protectedProcedure } from "@/server/trpc/trpc";
import { TRPCError, inferProcedureOutput } from "@trpc/server";
import { z } from "zod";

export const createLinearIssueForFeedback = protectedProcedure
  .input(z.object({ feedbackId: z.string() }))
  .mutation(async ({ input, ctx }) => {
    const { prisma, session } = ctx;

    const feedback = await prisma.feedback.findUnique({
      where: { id: input.feedbackId },
      include: {
        project: {
          select: {
            organizationId: true,
            linearLink: { select: { id: true } },
          },
        },
        linearIssueLink: { select: { id: true } },
      },
    });

    if (!feedback) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Feedback not found.",
      });
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

    if (feedback.linearIssueLink) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "A Linear issue already exists for this feedback.",
      });
    }

    if (!feedback.project.linearLink) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No Linear team linked to this project.",
      });
    }

    await inngest.send({
      name: "feedback/integration-issue-requested",
      data: { feedbackId: input.feedbackId, target: "linear" },
    });

    return { queued: true };
  });

export type CreateLinearIssueForFeedbackOutput = inferProcedureOutput<
  typeof createLinearIssueForFeedback
>;
