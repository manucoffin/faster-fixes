"use server";

import { protectedProcedure } from "@/server/trpc/trpc";
import { TRPCError, inferProcedureOutput } from "@trpc/server";
import crypto from "crypto";
import z from "zod";

export const regenerateApiKey = protectedProcedure
  .input(z.object({ projectId: z.string() }))
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

    const raw = "ff_" + crypto.randomBytes(32).toString("hex");
    const hash = crypto.createHash("sha256").update(raw).digest("hex");
    const lastFour = raw.slice(-4);

    await prisma.project.update({
      where: { id: input.projectId },
      data: { apiKeyHash: hash, apiKeyLastFour: lastFour },
    });

    return { rawApiKey: raw };
  });

export type RegenerateApiKeyOutput = inferProcedureOutput<typeof regenerateApiKey>;
