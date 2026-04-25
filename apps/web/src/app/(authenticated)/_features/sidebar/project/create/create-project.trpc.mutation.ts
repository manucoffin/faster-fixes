"use server";

import { generateApiKey } from "@/app/_features/project/generate-api-key";
import { generatePublicId } from "@/app/_features/project/generate-public-id";
import { enforceLimit } from "@/server/trpc/middlewares/enforce-limit";
import { planAwareProcedure } from "@/server/trpc/middlewares/with-plan-context";
import { TRPCError, inferProcedureOutput } from "@trpc/server";
import { CreateProjectSchema } from "./create-project.schema";

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
        domain: input.domain,
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
