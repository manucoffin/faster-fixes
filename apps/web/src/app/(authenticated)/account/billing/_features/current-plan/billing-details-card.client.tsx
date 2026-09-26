"use client";

import { useTRPC } from "@/lib/trpc/trpc-client";
import { SubscriptionStatus } from "@/app/_domains/subscription";
import { matchQueryStatus } from "@/utils/tanstack-query/match-query-status";
import { useQuery } from "@tanstack/react-query";
import { Empty, EmptyHeader, EmptyTitle } from "@workspace/ui/components/empty";
import { Skeleton } from "@workspace/ui/components/skeleton";

type BillingDetailsCardProps = {
  planName: string;
  stripeSubscriptionId?: string;
  subscriptionStatus?: string;
};

export function BillingDetailsCard({
  planName,
  stripeSubscriptionId,
  subscriptionStatus,
}: BillingDetailsCardProps) {
  const trpc = useTRPC();

  const getStripePricesQuery = useQuery(
    trpc.subscription.getPlansPrices.queryOptions({
      planNames: [planName],
    }),
  );

  const getStripeSubscriptionQuery = useQuery(
    trpc.subscription.getStripeSubscription.queryOptions(undefined, {
      enabled: !!stripeSubscriptionId,
    }),
  );

  return matchQueryStatus(getStripePricesQuery, {
    Loading: (
      <div className="flex flex-col rounded-md border p-4">
        <div className="p-4">
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="flex flex-col gap-3 p-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    ),
    Errored: (
      <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4">
        <p className="text-sm font-medium text-destructive">
          Error loading billing information
        </p>
      </div>
    ),
    Empty: (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>No information available</EmptyTitle>
        </EmptyHeader>
      </Empty>
    ),
    dataKey: planName,
    Success: ({ data }) => {
      const priceData = data[planName];
      // The annual price identifier is server configuration, so the billing
      // period is told from the prices this read returns.
      const currentPriceId = getStripeSubscriptionQuery.data?.currentPriceId;
      const billingPeriod =
        currentPriceId && priceData?.annual?.id === currentPriceId
          ? "annual"
          : "monthly";
      const price =
        billingPeriod === "annual" ? priceData?.annual : priceData?.monthly;

      if (!price) {
        return (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>Price unavailable</EmptyTitle>
            </EmptyHeader>
          </Empty>
        );
      }

      // Calculate price in euros (Stripe stores in cents)
      const priceValue = (price.unit_amount ?? 0) / 100;
      const priceHT = priceValue.toFixed(2);
      const priceTTC = (priceValue * 1.2).toFixed(2);
      const billingLabel =
        billingPeriod === "annual" ? "Annual price" : "Monthly price";

      return (
        <div className="flex flex-col rounded-md border">
          <h3 className="p-4 text-lg font-medium">Billing</h3>

          <div className="flex flex-col gap-3 p-4">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">
                {billingLabel}
              </span>
              <span className="text-sm font-medium">
                {priceHT} {price.currency.toUpperCase()}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">VAT (20%)</span>
              <span className="text-sm font-medium">
                {(priceValue * 0.2).toFixed(2)} {price.currency.toUpperCase()}
              </span>
            </div>

            {subscriptionStatus === SubscriptionStatus.Trialing && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Free trial
                </span>
                <span className="text-sm font-medium">
                  -{priceTTC} {price.currency.toUpperCase()}
                </span>
              </div>
            )}
          </div>

          <div className="mt-auto flex justify-between border-t p-4">
            <span className="font-medium">Total incl. tax</span>
            <span className="font-semibold">
              {subscriptionStatus === SubscriptionStatus.Trialing ? (
                <span className="">0 {price.currency.toUpperCase()}</span>
              ) : (
                `${priceTTC} ${price.currency.toUpperCase()}`
              )}
            </span>
          </div>
        </div>
      );
    },
  });
}
