"use client";

import { trpc } from "@/lib/trpc/trpc-client";
import {
  SUBSCRIPTION_PLANS,
  SubscriptionStatus,
} from "@/server/auth/config/subscription-plans";
import { matchQueryStatus } from "@/utils/tanstack-query/match-query-status";
import { Empty, EmptyHeader, EmptyTitle } from "@workspace/ui/components/empty";
import { Skeleton } from "@workspace/ui/components/skeleton";

interface BillingDetailsCardProps {
  planName: string;
  stripeSubscriptionId?: string;
  subscriptionStatus?: string;
}

export function BillingDetailsCard({
  planName,
  stripeSubscriptionId,
  subscriptionStatus,
}: BillingDetailsCardProps) {
  const getStripePricesQuery = trpc.stripe.getPlansPrices.useQuery({
    planNames: [planName],
  });

  const getStripeSubscriptionQuery = trpc.stripe.getStripeSubscription.useQuery(
    {
      stripeSubscriptionId: stripeSubscriptionId!,
    },
    {
      enabled: !!stripeSubscriptionId,
    },
  );

  // Determine billing period based on current price ID
  const determineBillingPeriod = () => {
    if (!getStripeSubscriptionQuery.data?.currentPriceId) return "monthly";

    const currentPriceId = getStripeSubscriptionQuery.data.currentPriceId;
    const plan = SUBSCRIPTION_PLANS.find((p) => p.name === planName);

    if (plan?.annualDiscountPriceId === currentPriceId) {
      return "annual";
    }
    return "monthly";
  };

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
      <div className="border-destructive/50 bg-destructive/10 rounded-md border p-4">
        <p className="text-destructive text-sm font-medium">
          Erreur lors du chargement des informations de facturation
        </p>
      </div>
    ),
    Empty: (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Aucune information disponible</EmptyTitle>
        </EmptyHeader>
      </Empty>
    ),
    dataKey: planName,
    Success: ({ data }) => {
      const priceData = data[planName];
      const billingPeriod = determineBillingPeriod();
      const price =
        billingPeriod === "annual" ? priceData?.annual : priceData?.monthly;

      if (!price) {
        return (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>Prix indisponible</EmptyTitle>
            </EmptyHeader>
          </Empty>
        );
      }

      // Calculate price in euros (Stripe stores in cents)
      const priceHT = Math.round((price.unit_amount ?? 0) / 100);
      const priceTTC = Math.round(priceHT * 1.2);
      const billingLabel =
        billingPeriod === "annual" ? "Prix annuel" : "Prix mensuel";

      return (
        <div className="flex flex-col rounded-md border">
          <h3 className="p-4 text-lg font-medium">Facturation</h3>

          <div className="flex flex-col gap-3 p-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">
                {billingLabel}
              </span>
              <span className="text-sm font-medium">
                {priceHT} {price.currency?.toUpperCase()}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">TVA (20%)</span>
              <span className="text-sm font-medium">
                {Math.round(priceHT * 0.2)} {price.currency?.toUpperCase()}
              </span>
            </div>

            {subscriptionStatus === SubscriptionStatus.Trialing && (
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">
                  Essai gratuit
                </span>
                <span className="text-sm font-medium">
                  -{priceTTC} {price.currency?.toUpperCase()}
                </span>
              </div>
            )}
          </div>

          <div className="mt-auto flex justify-between border-t p-4">
            <span className="font-medium">Total TTC</span>
            <span className="font-semibold">
              {subscriptionStatus === SubscriptionStatus.Trialing ? (
                <span className="">0 {price.currency?.toUpperCase()}</span>
              ) : (
                `${priceTTC} ${price.currency?.toUpperCase()}`
              )}
            </span>
          </div>
        </div>
      );
    },
  });
}
