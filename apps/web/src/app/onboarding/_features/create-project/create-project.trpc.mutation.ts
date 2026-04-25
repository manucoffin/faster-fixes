"use server";

import { generateApiKey } from "@/app/_features/project/generate-api-key";
import { generatePublicId } from "@/app/_features/project/generate-public-id";
import { protectedProcedure } from "@/server/trpc/trpc";
import { TRPCError, inferProcedureOutput } from "@trpc/server";
import { CreateOnboardingProjectSchema } from "./create-project.schema";

export const createOnboardingProject = protectedProcedure
  .input(CreateOnboardingProjectSchema)
  .mutation(async ({ input, ctx }) => {
    const { prisma, session } = ctx;

    const membership = await prisma.member.findFirst({
      where: { userId: session.user.id, role: "owner" },
      select: { organizationId: true },
    });

    if (!membership) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "No organization found.",
      });
    }

    // Handle refresh scenario: project already created during a previous attempt
    const existingProject = await prisma.project.findFirst({
      where: { organizationId: membership.organizationId },
      select: { id: true, name: true },
    });

    if (existingProject) {
      return {
        id: existingProject.id,
        name: existingProject.name,
        rawApiKey: null,
      };
    }

    const { raw, hash, lastFour } = generateApiKey();

    const project = await prisma.project.create({
      data: {
        name: input.name,
        domain: input.domain,
        publicId: generatePublicId(),
        apiKeyHash: hash,
        apiKeyLastFour: lastFour,
        organizationId: membership.organizationId,
        widgetConfig: { create: {} },
      },
    });

    return {
      id: project.id,
      name: project.name,
      rawApiKey: raw,
    };
  });

export type CreateOnboardingProjectOutput = inferProcedureOutput<
  typeof createOnboardingProject
>;
