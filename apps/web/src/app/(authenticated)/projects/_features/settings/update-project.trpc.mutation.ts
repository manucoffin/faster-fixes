"use server";

import { protectedProcedure } from "@/server/trpc/trpc";
import { TRPCError, inferProcedureOutput } from "@trpc/server";
import { UpdateProjectSchema } from "./update-project.schema";

export const updateProject = protectedProcedure
  .input(UpdateProjectSchema)
  .mutation(async ({ input, ctx }) => {
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
        role: { in: ["owner", "admin"] },
      },
    });

    if (!membership) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Access denied." });
    }

    await prisma.project.update({
      where: { id: input.projectId },
      data: {
        name: input.name,
        url: input.url,
        widgetConfig: {
          update: {
            color: input.widgetColor,
            position: input.widgetPosition,
          },
        },
      },
    });

    return { id: input.projectId };
  });

export type UpdateProjectOutput = inferProcedureOutput<typeof updateProject>;
