"use client";

import { UpgradeSubscriptionDialog } from "@/app/_features/subscription/upgrade-subscription/upgrade-subscription-dialog.client";
import { useTRPC } from "@/lib/trpc/trpc-client";
import { useQuery } from "@tanstack/react-query";
import {
  PLAN_FEATURES,
  SUBSCRIPTION_PLANS,
  SubscriptionStatus,
} from "@/server/auth/config/subscription-plans";
import { matchQueryStatus } from "@/utils/tanstack-query/match-query-status";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@workspace/ui/components/empty";
import { Separator } from "@workspace/ui/components/separator";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { Check } from "lucide-react";
import { ManageSubscriptionButton } from "../manage-subscription/manage-subscription-button.client";
import { BillingDetailsCard } from "./billing-details-card.client";
import { StatusIndicators } from "./status-indicators.client";

interface CurrentPlanProps {
  organizationId: string;
}

export function CurrentPlanCard({ organizationId }: CurrentPlanProps) {
  const trpc = useTRPC();

  const getActiveSubscriptionQuery =
    useQuery(trpc.authenticated.account.billing.subscription.get.queryOptions());

  return matchQueryStatus(getActiveSubscriptionQuery, {
    Loading: (
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-3">
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-6 w-24" />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* Left: Features skeleton */}
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="mt-0.5 size-4 shrink-0 rounded" />
                  <Skeleton className="h-5 w-48" />
                </div>
              ))}
            </div>
            {/* Right: Pricing skeleton */}
            <div className="rounded-lg border p-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="border-t pt-3" />
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-24" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    ),
    Errored: (
      <Card>
        <CardHeader>
          <CardTitle>Erreur</CardTitle>
          <CardDescription>
            Une erreur est survenue lors du chargement de votre plan
          </CardDescription>
        </CardHeader>
      </Card>
    ),
    Empty: (
      <Card>
        <CardContent className="pt-6">
          <Empty>
            <EmptyHeader>
              <EmptyTitle>Aucun abonnement actif</EmptyTitle>
              <EmptyDescription>
                Vous n&apos;avez pas d&apos;abonnement actif pour le moment
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <UpgradeSubscriptionDialog
                trigger={<Button>Je choisis ma formule</Button>}
              />
            </EmptyContent>
          </Empty>
        </CardContent>
      </Card>
    ),
    Success: ({ data: subscription }) => {
      const plan = SUBSCRIPTION_PLANS.find((p) => p.name === subscription.plan);

      const formatDate = (date: string | Date) =>
        new Date(date).toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });

      const billingPeriodText =
        subscription.periodStart && subscription.periodEnd
          ? `Période du ${formatDate(subscription.periodStart)} au ${formatDate(subscription.periodEnd)}`
          : "Période de facturation indisponible";

      return (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">
                Abonnement{" "}
                <span className="capitalize">
                  {plan?.name || subscription.plan}
                </span>
              </CardTitle>

              <StatusIndicators
                cancelAtPeriodEnd={subscription.cancelAtPeriodEnd}
              />
            </div>

            <CardDescription>{billingPeriodText}</CardDescription>
          </CardHeader>

          <CardContent>
            <Separator className="mb-8" />

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              {/* Left: Plan Features */}
              <div className="flex flex-col gap-6">
                {subscription.plan in PLAN_FEATURES && (
                  <div className="space-y-3">
                    {PLAN_FEATURES[
                      subscription.plan as keyof typeof PLAN_FEATURES
                    ]
                      .filter((feature) => feature.id !== "kylo_features")
                      .map((feature, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <Check className="mt-0.5 size-4 shrink-0 text-green-600" />
                          <p className="text-sm">{feature.label}</p>
                        </div>
                      ))}
                  </div>
                )}

                <UpgradeSubscriptionDialog />
              </div>

              {/* Right: Billing Summary */}
              <BillingDetailsCard
                planName={subscription.plan}
                stripeSubscriptionId={subscription.stripeSubscriptionId}
                subscriptionStatus={subscription.status}
              />
            </div>
          </CardContent>

          <CardFooter className="flex justify-end">
            {subscription.status === SubscriptionStatus.Active ||
              subscription.status === SubscriptionStatus.Trialing ? (
              <div className="flex gap-2 pt-4">
                {/* {!subscription.cancelAtPeriodEnd &&
                  subscription.stripeSubscriptionId && (
                    <CancelSubscriptionButton
                      subscriptionId={subscription.stripeSubscriptionId}
                    />
                  )} */}

                <ManageSubscriptionButton />
              </div>
            ) : null}
          </CardFooter>
        </Card>
      );
    },
  });
}
