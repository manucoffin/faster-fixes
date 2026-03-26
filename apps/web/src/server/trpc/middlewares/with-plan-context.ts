import {
  resolveOrganizationPlan,
  type ResolvedPlan,
} from "@/server/auth/subscription";
import { TRPCError } from "@trpc/server";
import { protectedProcedure } from "../trpc";

export const planAwareProcedure = protectedProcedure.use(
  async ({ ctx, next }) => {
    const organizationId = (
      ctx.session.session as { activeOrganizationId?: string | null }
    ).activeOrganizationId;

    if (!organizationId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No active organization selected.",
      });
    }

    const plan = await resolveOrganizationPlan(organizationId, ctx.prisma);

    return next({ ctx: { plan } });
  },
);

// Re-export the plan type for consumers that need it
export type { ResolvedPlan };
