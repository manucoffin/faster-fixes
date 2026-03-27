"use server";

import { protectedProcedure } from "@/server/trpc/trpc";
import { TRPCError } from "@trpc/server";
import crypto from "crypto";
import { CreateOnboardingProjectSchema } from "./complete-onboarding.schema";

function generateApiKey() {
  const raw = "ff_" + crypto.randomBytes(32).toString("hex");
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  const lastFour = raw.slice(-4);
  return { raw, hash, lastFour };
}

function generatePublicId() {
  return "proj_" + crypto.randomBytes(12).toString("hex");
}

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
        url: input.url,
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

export const completeOnboarding = protectedProcedure.mutation(
  async ({ ctx }) => {
    const { prisma, session } = ctx;

    await prisma.user.update({
      where: { id: session.user.id },
      data: { onboardingCompleted: true },
    });

    return { success: true };
  },
);
