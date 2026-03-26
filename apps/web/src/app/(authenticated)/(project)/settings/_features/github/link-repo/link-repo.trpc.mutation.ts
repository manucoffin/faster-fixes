"use server";

import { enforceFeature } from "@/server/trpc/middlewares/enforce-feature";
import { planAwareProcedure } from "@/server/trpc/middlewares/with-plan-context";
import { TRPCError, inferProcedureOutput } from "@trpc/server";
import { LinkRepoSchema } from "./link-repo.schema";

export const linkRepo = planAwareProcedure
  .use(enforceFeature("githubIntegration"))
  .input(LinkRepoSchema)
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
        message: "Only owners and admins can link repositories.",
      });
    }

    const installation = await prisma.gitHubInstallation.findFirst({
      where: { organizationId: project.organizationId },
    });

    if (!installation) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No GitHub installation found. Connect GitHub first.",
      });
    }

    const link = await prisma.projectGitHubLink.upsert({
      where: { projectId: input.projectId },
      update: {
        repoId: input.repoId,
        repoOwner: input.repoOwner,
        repoName: input.repoName,
        repoFullName: input.repoFullName,
        autoCreateIssues: input.autoCreateIssues,
        defaultLabels: input.defaultLabels,
      },
      create: {
        projectId: input.projectId,
        gitHubInstallationId: installation.id,
        repoId: input.repoId,
        repoOwner: input.repoOwner,
        repoName: input.repoName,
        repoFullName: input.repoFullName,
        autoCreateIssues: input.autoCreateIssues,
        defaultLabels: input.defaultLabels,
      },
    });

    return { id: link.id };
  });

export type LinkRepoOutput = inferProcedureOutput<typeof linkRepo>;
