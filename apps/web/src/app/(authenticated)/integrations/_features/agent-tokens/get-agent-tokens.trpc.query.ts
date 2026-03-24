"use server";

import { protectedProcedure } from "@/server/trpc/trpc";
import { inferProcedureOutput, TRPCError } from "@trpc/server";
import z from "zod";

export const getAgentTokens = protectedProcedure
  .input(z.object({ organizationId: z.string() }))
  .query(async ({ input, ctx }) => {
    const { prisma, session } = ctx;

    const membership = await prisma.member.findFirst({
      where: {
        organizationId: input.organizationId,
        userId: session.user.id,
      },
    });

    if (!membership) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Access denied." });
    }

    const tokens = await prisma.agentToken.findMany({
      where: { organizationId: input.organizationId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        tokenLastFour: true,
        scopes: true,
        isActive: true,
        lastUsedAt: true,
        createdAt: true,
        revokedAt: true,
      },
    });

    return tokens;
  });

export type GetAgentTokensOutput = inferProcedureOutput<typeof getAgentTokens>;
