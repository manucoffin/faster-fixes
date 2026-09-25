import { NotFoundError } from "@/server/errors/domain-errors";
import { prisma } from "@workspace/db";
import type { UpdateSubscriptionInput } from "./update-subscription.schema";

export async function updateSubscription(
  input: UpdateSubscriptionInput,
  db: typeof prisma = prisma,
) {
  const subscription = await db.subscription.findUnique({
    where: { id: input.id },
    select: { id: true },
  });

  // The denial needs the loaded Subscription, so it belongs here rather than at
  // the transport edge.
  if (!subscription) {
    throw new NotFoundError("Subscription not found");
  }

  return await db.subscription.update({
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
}

export type UpdateSubscriptionOutput = Awaited<
  ReturnType<typeof updateSubscription>
>;
