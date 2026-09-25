import type { FeatureGate } from "@/app/_domains/subscription";
import { checkFeatureAccess } from "@/server/auth/subscription";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { middleware } from "../trpc";

const ProjectScopedInputSchema = z.object({ projectId: z.string() });

// Every gated capability configures a Project, so the Plan checked is the one
// of the Project's Organization, not the active one: a User may hold a Free and
// a Pro Organization and write into either. Mount it after `.input()`, whose
// schema must carry `projectId`.
export function enforceFeature(feature: FeatureGate) {
  return middleware(async ({ ctx, input, next }) => {
    const { projectId } = ProjectScopedInputSchema.parse(input);
    const userId = ctx.session?.user.id;

    if (!userId) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    // Scoped to the caller's memberships so a Project of another Organization
    // does not reveal its Plan. The role check stays in the service.
    const project = await ctx.prisma.project.findFirst({
      where: {
        id: projectId,
        organization: { members: { some: { userId } } },
      },
      select: { organizationId: true },
    });

    if (!project) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Project not found." });
    }

    const result = await checkFeatureAccess(
      project.organizationId,
      feature,
      ctx.prisma,
    );

    if (!result.allowed) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `This feature requires the ${result.denial.metadata.minimumRequiredPlan} plan.`,
        cause: result.denial,
      });
    }

    return next();
  });
}
