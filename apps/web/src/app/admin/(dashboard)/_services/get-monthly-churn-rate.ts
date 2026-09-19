import { SubscriptionStatus } from "@/app/_domains/subscription";
import { prisma } from "@workspace/db/index";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Monthly churn rate as a 0..1 fraction.
 *
 * Denominator is the active base at the start of the window (active now + those
 * who churned during it), not active-now alone — otherwise a shrinking base
 * inflates the rate. Returns null when there is no base to divide by, so callers
 * can render "—" instead of a misleading 0% or a division-by-zero LTV.
 */
export async function getMonthlyChurnRate(): Promise<number | null> {
  const since = new Date(Date.now() - THIRTY_DAYS_MS);

  const [activeNow, churnedLast30] = await Promise.all([
    prisma.subscription.count({
      where: {
        status: {
          in: [SubscriptionStatus.Active, SubscriptionStatus.Trialing],
        },
      },
    }),
    prisma.subscription.count({
      where: {
        status: SubscriptionStatus.Canceled,
        canceledAt: { gte: since },
      },
    }),
  ]);

  const baseAtStart = activeNow + churnedLast30;
  if (baseAtStart === 0) return null;

  return churnedLast30 / baseAtStart;
}

export type GetMonthlyChurnRateOutput = Awaited<
  ReturnType<typeof getMonthlyChurnRate>
>;
