"use server";

import { protectedProcedure } from "@/server/trpc/trpc";
import { inferProcedureOutput, TRPCError } from "@trpc/server";
import z from "zod";

export const getReviewers = protectedProcedure
  .input(z.object({ projectId: z.string() }))
  .query(async ({ input, ctx }) => {
    const { prisma, session } = ctx;

    const project = await prisma.project.findUnique({
      where: { id: input.projectId },
    });

    if (!project) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Project not found." });
    }

    const membership = await prisma.member.findFirst({
      where: {
        organizationId: project.organizationId,
        userId: session.user.id,
      },
    });

    if (!membership) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Access denied." });
    }

    const reviewers = await prisma.reviewer.findMany({
      where: { projectId: input.projectId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { feedback: true } },
      },
    });

    return reviewers.map((r) => ({
      id: r.id,
      name: r.name,
      token: r.token,
      isActive: r.isActive,
      createdAt: r.createdAt,
      feedbackCount: r._count.feedback,
      shareUrl: `https://${project.domain}?ff_token=${r.token}`,
    }));
  });

export type GetReviewersOutput = inferProcedureOutput<typeof getReviewers>;
