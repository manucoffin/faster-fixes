"use server";

import { protectedProcedure } from "@/server/trpc/trpc";
import { inferProcedureOutput, TRPCError } from "@trpc/server";
import z from "zod";

export const getProject = protectedProcedure
  .input(z.object({ projectId: z.string() }))
  .query(async ({ input, ctx }) => {
    const { prisma, session } = ctx;

    const project = await prisma.project.findUnique({
      where: { id: input.projectId },
      include: { widgetConfig: true },
    });

    if (!project) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Projet introuvable." });
    }

    const membership = await prisma.member.findFirst({
      where: {
        organizationId: project.organizationId,
        userId: session.user.id,
      },
    });

    if (!membership) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Accès refusé." });
    }

    return {
      id: project.id,
      name: project.name,
      url: project.url,
      apiKeyLastFour: project.apiKeyLastFour,
      createdAt: project.createdAt,
      widgetConfig: project.widgetConfig
        ? {
            color: project.widgetConfig.color,
            position: project.widgetConfig.position,
          }
        : null,
    };
  });

export type GetProjectOutput = inferProcedureOutput<typeof getProject>;
