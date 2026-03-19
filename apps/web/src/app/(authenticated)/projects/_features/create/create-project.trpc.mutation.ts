"use server";

import { protectedProcedure } from "@/server/trpc/trpc";
import { TRPCError, inferProcedureOutput } from "@trpc/server";
import crypto from "crypto";
import { CreateProjectSchema } from "./create-project.schema";

function generateApiKey(): { raw: string; hash: string; lastFour: string } {
  const raw = "ff_" + crypto.randomBytes(32).toString("hex");
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  const lastFour = raw.slice(-4);
  return { raw, hash, lastFour };
}

export const createProject = protectedProcedure
  .input(CreateProjectSchema)
  .mutation(async ({ input, ctx }) => {
    const { prisma, session } = ctx;

    const membership = await prisma.member.findFirst({
      where: {
        organizationId: input.organizationId,
        userId: session.user.id,
        role: { in: ["owner", "admin"] },
      },
    });

    if (!membership) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You do not have permission to create a project.",
      });
    }

    // Enforce plan-based project limit
    const subscription = await prisma.subscription.findFirst({
      where: { referenceId: input.organizationId },
    });

    if (subscription?.plan === "basic") {
      const projectCount = await prisma.project.count({
        where: { organizationId: input.organizationId },
      });

      if (projectCount >= 1) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "The Basic plan is limited to 1 project. Upgrade to the Premium plan to create unlimited projects.",
        });
      }
    }

    const { raw, hash, lastFour } = generateApiKey();

    const project = await prisma.project.create({
      data: {
        name: input.name,
        url: input.url,
        apiKeyHash: hash,
        apiKeyLastFour: lastFour,
        organizationId: input.organizationId,
        widgetConfig: {
          create: {
            color: "#6366f1",
            position: "bottom-right",
          },
        },
      },
    });

    return {
      id: project.id,
      name: project.name,
      rawApiKey: raw,
    };
  });

export type CreateProjectOutput = inferProcedureOutput<typeof createProject>;
