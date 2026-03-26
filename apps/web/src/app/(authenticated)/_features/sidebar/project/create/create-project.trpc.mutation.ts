"use server";

import { enforceLimit } from "@/server/trpc/middlewares/enforce-limit";
import { planAwareProcedure } from "@/server/trpc/middlewares/with-plan-context";
import { TRPCError, inferProcedureOutput } from "@trpc/server";
import crypto from "crypto";
import { CreateProjectSchema } from "./create-project.schema";

function generateApiKey(): { raw: string; hash: string; lastFour: string } {
  const raw = "ff_" + crypto.randomBytes(32).toString("hex");
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  const lastFour = raw.slice(-4);
  return { raw, hash, lastFour };
}

function generatePublicId(): string {
  return "proj_" + crypto.randomBytes(12).toString("hex");
}

export const createProject = planAwareProcedure
  .use(enforceLimit("projects"))
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

    const { raw, hash, lastFour } = generateApiKey();

    const project = await prisma.project.create({
      data: {
        name: input.name,
        url: input.url,
        publicId: generatePublicId(),
        apiKeyHash: hash,
        apiKeyLastFour: lastFour,
        organizationId: input.organizationId,
        widgetConfig: {
          create: {},
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
