import { adminProcedure } from "@/server/trpc/trpc";
import { TRPCError } from "@trpc/server";
import { UpdateSubscriptionSchema } from "./subscription.schema";

export const updateSubscription = adminProcedure
  .input(UpdateSubscriptionSchema)
  .mutation(async ({ input, ctx }) => {
    const subscription = await ctx.prisma.subscription.findUnique({
      where: { id: input.id },
    });

    if (!subscription) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Subscription not found",
      });
    }

    const updatedSubscription = await ctx.prisma.subscription.update({
      where: { id: input.id },
      data: {
        plan: input.plan,
        referenceId: input.organizationId,
        organizationId: input.organizationId,
        status: input.status,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        cancelAtPeriodEnd: input.cancelAtPeriodEnd,
        trialStart: input.trialStart,
        trialEnd: input.trialEnd,
        // stripeCustomerId: input.stripeCustomerId,
        // stripeSubscriptionId: input.stripeSubscriptionId,
      },
      select: {
        id: true,
        plan: true,
        status: true,
        periodStart: true,
        periodEnd: true,
        cancelAtPeriodEnd: true,
        trialStart: true,
        trialEnd: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        organizationId: true,
      },
    });

    return updatedSubscription;
  });
