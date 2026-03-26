import type { LimitableResource } from "@/server/auth/config/subscription-plans";
import { checkResourceLimit } from "@/server/auth/subscription";
import { TRPCError } from "@trpc/server";
import { middleware } from "../trpc";

export function enforceLimit(resource: LimitableResource) {
  return middleware(async ({ ctx, next }) => {
    const organizationId = (
      ctx.session as {
        session?: { activeOrganizationId?: string | null };
      } | null
    )?.session?.activeOrganizationId;

    if (!organizationId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No active organization selected.",
      });
    }

    const result = await checkResourceLimit(
      organizationId,
      resource,
      ctx.prisma,
    );

    if (!result.allowed) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `You've reached the ${resource} limit for your plan (${result.denial.metadata.current}/${result.denial.metadata.limit}). Upgrade to get more.`,
        cause: result.denial,
      });
    }

    return next();
  });
}
