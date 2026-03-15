"use server";

import { protectedProcedure } from "@/server/trpc/trpc";
import { inferProcedureOutput, TRPCError } from "@trpc/server";
import z from "zod";

export const getProjects = protectedProcedure
  .input(z.object({ organizationId: z.string() }))
  .query(async ({ input, ctx }) => {
    const { prisma, session } = ctx;

    const membership = await prisma.member.findFirst({
      where: {
        organizationId: input.organizationId,
        userId: session.user.id,
      },
    });

    if (!membership) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Vous n'avez pas accès à cette organisation.",
      });
    }

    const projects = await prisma.project.findMany({
      where: { organizationId: input.organizationId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { feedback: true } },
      },
    });

    return projects.map((p) => ({
      id: p.id,
      name: p.name,
      url: p.url,
      apiKeyLastFour: p.apiKeyLastFour,
      createdAt: p.createdAt,
      feedbackCount: p._count.feedback,
    }));
  });

export type GetProjectsOutput = inferProcedureOutput<typeof getProjects>;
