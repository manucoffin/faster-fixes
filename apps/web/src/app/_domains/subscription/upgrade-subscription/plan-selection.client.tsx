"use client";

import { useTRPC } from "@/lib/trpc/trpc-client";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  PAID_PLAN_NAMES,
  PLAN_DESCRIPTIONS,
  PLAN_FEATURES,
  SubscriptionPlanName,
} from "../_helpers/subscription-plans";

import { matchQueryStatus } from "@/utils/tanstack-query/match-query-status";
import { Button } from "@workspace/ui/components/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@workspace/ui/components/empty";
import { Label } from "@workspace/ui/components/label";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { Switch } from "@workspace/ui/components/switch";
import { Loader2 } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { PlanCard } from "../plan-card/plan-card";

export function PlanSelection() {
  const trpc = useTRPC();
  const [isAnnual, setIsAnnual] = useState(false);

  const stripePricesQuery = useQuery(
    trpc.subscription.getPlansPrices.queryOptions({
      planNames: [...PAID_PLAN_NAMES],
    }),
  );

  const upgradePlanMutation = useMutation(
    trpc.subscription.upgrade.mutationOptions({
      onSuccess: (data) => {
        if (data.url) {
          window.location.href = data.url;
        }
      },
      onError: (error) => {
        console.error("Error upgrading plan:", error);
        toast(error.message);
      },
    }),
  );

  const handleUpgrade = useCallback(
    async (planName: string) => {
      await upgradePlanMutation.mutateAsync({
        planName,
        annual: isAnnual,
      });
    },
    [upgradePlanMutation, isAnnual],
  );

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <Switch
          id="annual-billing"
          checked={isAnnual}
          onCheckedChange={setIsAnnual}
        />
        <Label htmlFor="annual-billing" className="cursor-pointer">
          Annual billing
        </Label>
      </div>

      {matchQueryStatus(stripePricesQuery, {
        Loading: (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {PAID_PLAN_NAMES.map((planName) => (
              <Skeleton key={planName} className="h-96" />
            ))}
          </div>
        ),
        Errored: (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>Failed to load pricing</EmptyTitle>
              <EmptyDescription>
                An error occurred while loading pricing. Please try again.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ),
        Empty: (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No plans available</EmptyTitle>
              <EmptyDescription>
                No subscription plans are currently available.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ),
        Success: ({ data: stripePrices }) => {
          return (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {PAID_PLAN_NAMES.map((planName) => {
                const priceData = stripePrices[planName];
                const selectedPrice = isAnnual
                  ? priceData?.annual
                  : priceData?.monthly;
                const features = PLAN_FEATURES[planName];
                const isHighlighted = planName === SubscriptionPlanName.Pro;

                // A tiered or custom price has no unit amount.
                const price = (selectedPrice?.unit_amount ?? 0) / 100;

                return (
                  <PlanCard
                    key={planName}
                    title={planName}
                    description={PLAN_DESCRIPTIONS[planName]}
                    price={price}
                    badge={isHighlighted ? "Most popular" : undefined}
                    features={features}
                    variant={isHighlighted ? "highlighted" : "default"}
                    isAnnual={isAnnual}
                  >
                    <Button
                      onClick={() => handleUpgrade(planName)}
                      disabled={upgradePlanMutation.isPending}
                      className="w-full"
                      variant={isHighlighted ? "default" : "secondary"}
                    >
                      {upgradePlanMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 size-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <span>
                          Choose{" "}
                          <span className="font-semibold capitalize">
                            {planName}
                          </span>
                        </span>
                      )}
                    </Button>
                  </PlanCard>
                );
              })}
            </div>
          );
        },
      })}
    </div>
  );
}
