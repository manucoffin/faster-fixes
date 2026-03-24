"use server";

import { protectedProcedure } from "@/server/trpc/trpc";
import { TRPCError, inferProcedureOutput } from "@trpc/server";
import crypto from "crypto";
import { CreateAgentTokenSchema } from "./create-agent-token.schema";

export const createAgentToken = protectedProcedure
  .input(CreateAgentTokenSchema)
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
      throw new TRPCError({ code: "FORBIDDEN", message: "Access denied." });
    }

    const raw = "ff_agent_" + crypto.randomBytes(32).toString("hex");
    const hash = crypto.createHash("sha256").update(raw).digest("hex");
    const lastFour = raw.slice(-4);

    await prisma.agentToken.create({
      data: {
        name: input.name,
        tokenHash: hash,
        tokenLastFour: lastFour,
        organizationId: input.organizationId,
        scopes: input.scopes,
      },
    });

    return { rawToken: raw };
  });

export type CreateAgentTokenOutput = inferProcedureOutput<
  typeof createAgentToken
>;
