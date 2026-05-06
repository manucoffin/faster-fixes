"use server";

import { enforceFeature } from "@/server/trpc/middlewares/enforce-feature";
import { planAwareProcedure } from "@/server/trpc/middlewares/with-plan-context";
import { TRPCError, inferProcedureOutput } from "@trpc/server";
import { UpdateProjectLinearLinkSchema } from "./update-project-linear-link.schema";

export const updateProjectLinearLink = planAwareProcedure
  .use(enforceFeature("linearIntegration"))
  .input(UpdateProjectLinearLinkSchema)
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
        message: "Only owners and admins can update the Linear link.",
      });
    }

    if (input.kind === "team_change") {
      await prisma.projectLinearLink.update({
        where: { projectId: input.projectId },
        data: {
          teamId: input.teamId,
          teamKey: input.teamKey,
          teamName: input.teamName,
          defaultStateId: input.defaultStateId,
          defaultLabelIds: input.defaultLabelIds,
          defaultPriority: input.defaultPriority,
          autoCreateIssues: input.autoCreateIssues,
          linkHealthIssue: null,
        },
      });
      return { success: true };
    }

    await prisma.projectLinearLink.update({
      where: { projectId: input.projectId },
      data: {
        ...(input.defaultStateId !== undefined && {
          defaultStateId: input.defaultStateId,
        }),
        ...(input.defaultLabelIds !== undefined && {
          defaultLabelIds: input.defaultLabelIds,
        }),
        ...(input.defaultPriority !== undefined && {
          defaultPriority: input.defaultPriority,
        }),
        ...(input.autoCreateIssues !== undefined && {
          autoCreateIssues: input.autoCreateIssues,
        }),
        // Successful save clears any stale-ID warning from previous runs.
        linkHealthIssue: null,
      },
    });

    return { success: true };
  });

export type UpdateProjectLinearLinkOutput = inferProcedureOutput<
  typeof updateProjectLinearLink
>;
