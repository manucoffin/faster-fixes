"use server";

import { enforceFeature } from "@/server/trpc/middlewares/enforce-feature";
import { planAwareProcedure } from "@/server/trpc/middlewares/with-plan-context";
import { TRPCError, inferProcedureOutput } from "@trpc/server";
import { LinkLinearTeamSchema } from "./link-team.schema";

export const linkLinearTeam = planAwareProcedure
  .use(enforceFeature("linearIntegration"))
  .input(LinkLinearTeamSchema)
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
        message: "Only owners and admins can link Linear teams.",
      });
    }

    const installation = await prisma.linearInstallation.findUnique({
      where: { organizationId: project.organizationId },
    });

    if (!installation) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No Linear installation found. Connect Linear first.",
      });
    }

    const link = await prisma.projectLinearLink.upsert({
      where: { projectId: input.projectId },
      update: {
        linearInstallationId: installation.id,
        teamId: input.teamId,
        teamKey: input.teamKey,
        teamName: input.teamName,
        defaultStateId: input.defaultStateId,
        defaultLabelIds: input.defaultLabelIds,
        defaultPriority: input.defaultPriority,
        autoCreateIssues: input.autoCreateIssues,
        linkHealthIssue: null,
      },
      create: {
        projectId: input.projectId,
        linearInstallationId: installation.id,
        teamId: input.teamId,
        teamKey: input.teamKey,
        teamName: input.teamName,
        defaultStateId: input.defaultStateId,
        defaultLabelIds: input.defaultLabelIds,
        defaultPriority: input.defaultPriority,
        autoCreateIssues: input.autoCreateIssues,
      },
    });

    return { id: link.id };
  });

export type LinkLinearTeamOutput = inferProcedureOutput<typeof linkLinearTeam>;
