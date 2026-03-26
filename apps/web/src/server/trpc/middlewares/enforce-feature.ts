import type { FeatureGate } from "@/server/auth/config/subscription-plans";
import { checkFeatureAccess } from "@/server/subscription";
import { TRPCError } from "@trpc/server";
import { middleware } from "../trpc";

export function enforceFeature(feature: FeatureGate) {
  return middleware(async ({ ctx, next }) => {
    const organizationId = (
      ctx.session as { session?: { activeOrganizationId?: string | null } } | null
    )?.session?.activeOrganizationId;

    if (!organizationId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No active organization selected.",
      });
    }

    const result = await checkFeatureAccess(organizationId, feature, ctx.prisma);

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
