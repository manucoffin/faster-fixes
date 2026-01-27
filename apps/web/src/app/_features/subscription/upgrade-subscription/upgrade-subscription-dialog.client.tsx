"use client";

import { trpc } from "@/lib/trpc/trpc-client";
import {
  PLAN_DESCRIPTIONS,
  PLAN_FEATURES,
  SUBSCRIPTION_PLANS,
  SubscriptionPlanName,
} from "@/server/auth/config/subscription-plans";
import { matchQueryStatus } from "@/utils/tanstack-query/match-query-status";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
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
import { ReactNode, useCallback, useState } from "react";
import { toast } from "sonner";
import { PlanCard } from "../plan-card/plan-card";

interface UpgradeSubscriptionDialogProps {
  trigger?: ReactNode;
}

export function UpgradeSubscriptionDialog({
  trigger,
}: UpgradeSubscriptionDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnnual, setIsAnnual] = useState(false);

  // Fetch stripe prices for all plans
  const stripePricesQuery = trpc.subscription.getPlansPrices.useQuery(
    {
      planNames: SUBSCRIPTION_PLANS.map((p) => p.name),
    },
    {
      enabled: isOpen, // Only fetch when dialog is open
    },
  );

  const upgradePlanMutation =
    trpc.subscription.upgrade.useMutation(
      {
        onSuccess: (data) => {
          // Redirect to Stripe checkout
          if (data.url) {
            window.location.href = data.url;
          }
        },
        onError: (error) => {
          console.error("Error upgrading plan:", error);
          toast(error.message);
        },
      },
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

  const today = new Date();
  const launchPromotionEndDate = new Date("2026-01-01");

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline">Changer de plan</Button>}
      </DialogTrigger>
      <DialogContent className="h-full w-full max-w-full overflow-y-auto sm:max-h-[95svh] sm:max-w-[90svw] md:h-fit xl:max-w-[60svw]">
        <DialogHeader className="h-fit">
          <DialogTitle>Choisissez votre plan</DialogTitle>
          <DialogDescription>
            Sélectionnez le plan qui correspond le mieux à vos besoins
          </DialogDescription>

          {today < launchPromotionEndDate ? (
            <div className="rounded-2xl border border-blue-800/20 bg-blue-50 p-3">
              Pour les fêtes, Tobalgo vous offre un{" "}
              <strong>accès gratuit</strong> à toutes les fonctionnalités,
              jusqu&apos;au 31 décembre inclus ! 🥳 Prenez votre abonnement dès
              maintenant pour en profiter.
            </div>
          ) : null}

          <div className="mt-4 flex items-center gap-2">
            <Switch
              id="annual"
              checked={isAnnual}
              onCheckedChange={setIsAnnual}
            />
            <Label htmlFor="annual" className="cursor-pointer">
              Facturation annuelle
            </Label>
          </div>
        </DialogHeader>

        {matchQueryStatus(stripePricesQuery, {
          Loading: (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {Array.from({ length: SUBSCRIPTION_PLANS.length }).map((_, i) => (
                <Skeleton key={i} className="h-96" />
              ))}
            </div>
          ),
          Errored: (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>Erreur lors du chargement des prix</EmptyTitle>
                <EmptyDescription>
                  Une erreur s&apos;est produite lors du chargement des tarifs.
                  Veuillez réessayer.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ),
          Empty: (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>Aucun plan disponible</EmptyTitle>
                <EmptyDescription>
                  Aucun plan d&apos;abonnement n&apos;est actuellement
                  disponible.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ),
          Success: ({ data: stripePrices }) => {
            // Get all unique feature IDs from all plans
            const allFeatureIds = new Set(
              Object.values(PLAN_FEATURES)
                .flat()
                .map((f) => f.id),
            );

            // Count how many plans have each feature
            const featureCountByPlan = Array.from(allFeatureIds).map((id) => ({
              id,
              count: Object.values(PLAN_FEATURES).filter((features) =>
                features.some((f) => f.id === id),
              ).length,
            }));

            // Features that appear in ALL plans (identical features)
            const commonFeatureIds = new Set(
              featureCountByPlan
                .filter((f) => f.count === Object.keys(PLAN_FEATURES).length)
                .map((f) => f.id),
            );

            return (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {SUBSCRIPTION_PLANS.map((plan) => {
                  const priceData = stripePrices[plan.name];
                  const selectedPrice = isAnnual
                    ? priceData?.annual
                    : priceData?.monthly;
                  const allFeatures =
                    PLAN_FEATURES[plan.name as keyof typeof PLAN_FEATURES] ||
                    [];
                  // Filter out common features only for Premium plan
                  const features =
                    plan.name === SubscriptionPlanName.Premium
                      ? allFeatures.filter((f) => !commonFeatureIds.has(f.id))
                      : allFeatures;
                  const isHighlighted =
                    plan.name === SubscriptionPlanName.Premium;

                  // Calculate price in euros (Stripe stores in cents)
                  const priceHT = selectedPrice
                    ? selectedPrice.unit_amount! / 100
                    : 0;
                  const priceTTC = (priceHT * 1.2);

                  const freeTrialDays = plan.freeTrial?.days;

                  return (
                    <PlanCard
                      key={plan.name}
                      title={plan.name}
                      description={
                        PLAN_DESCRIPTIONS[plan.name as SubscriptionPlanName]
                      }
                      price={priceHT}
                      priceTTC={priceTTC}
                      freeTrialDays={freeTrialDays}
                      badge={isHighlighted ? "Le plus populaire" : undefined}
                      features={features}
                      variant={isHighlighted ? "highlighted" : "default"}
                      isAnnual={isAnnual}
                    >
                      <Button
                        onClick={() => handleUpgrade(plan.name)}
                        disabled={upgradePlanMutation.isPending}
                        className="w-full"
                        variant={isHighlighted ? "default" : "secondary"}
                      >
                        {upgradePlanMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 size-4 animate-spin" />
                            Chargement...
                          </>
                        ) : (
                          <span>
                            Je choisis{" "}
                            <span className="font-semibold capitalize">
                              {plan.name}
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
      </DialogContent>
    </Dialog>
  );
}
