"use server";

import { protectedProcedure } from "@/server/trpc/trpc";
import { TRPCError, inferProcedureOutput } from "@trpc/server";
import crypto from "crypto";
import { CreateReviewerSchema } from "./create-reviewer.schema";

export const createReviewer = protectedProcedure
  .input(CreateReviewerSchema)
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

    const token = crypto.randomBytes(24).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const reviewer = await prisma.reviewer.create({
      data: {
        projectId: input.projectId,
        name: input.name,
        token: tokenHash,
      },
    });

    // Return raw token once — only the hash is persisted
    return {
      id: reviewer.id,
      name: reviewer.name,
      token,
      shareUrl: `https://${project.domain}?ff_token=${token}`,
    };
  });

export type CreateReviewerOutput = inferProcedureOutput<typeof createReviewer>;
