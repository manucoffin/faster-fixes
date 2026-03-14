"use client";

import { trpc } from "@/lib/trpc/trpc-client";
import { SubscriptionStatus } from "@/server/auth/config/subscription-plans";
import { matchQueryStatus } from "@/utils/tanstack-query/match-query-status";
import { ManageSubscriptionButton } from "../manage-subscription/manage-subscription-button.client";

export const SubscriptionStatusBanner = () => {
  const getSubscriptionStatusQuery =
    trpc.authenticated.account.billing.subscription.status.useQuery();

  const formatDate = (date: string | Date) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return matchQueryStatus(getSubscriptionStatusQuery, {
    Loading: <></>,
    Errored: <></>,
    Success: ({ data: subscription }) => {
      if (!subscription) {
        return <></>;
      }

      if (subscription.cancelAtPeriodEnd) {
        const canceledAt = new Date(subscription.periodEnd || "");
        const formattedDate = formatDate(canceledAt);

        return (
          <div className="rounded-2xl border border-yellow-800/20 bg-yellow-50 p-4">
            <div className="flex w-full flex-col items-center justify-between gap-4 md:flex-row">
              <div>
                <p className="font-semibold">Abonnement annulé</p>
                <p className="text-sm opacity-90">
                  Ton abonnement se terminera le{" "}
                  <strong>{formattedDate}</strong>. Tu perdras l&apos;accès aux
                  fonctionnalités premium après cette date.
                </p>
              </div>

              {/* {subscription.stripeSubscriptionId && (
                <RestoreSubscriptionButton
                  subscriptionId={subscription.stripeSubscriptionId}
                  variant="outline"
                />
              )} */}
              <ManageSubscriptionButton variant="outline" />
            </div>
          </div>
        );
      }

      if (subscription.status === SubscriptionStatus.Trialing) {
        const trialEnd = new Date(subscription.trialEnd || "");
        const formattedDate = formatDate(trialEnd);

        return (
          <div className="rounded-2xl border border-blue-800/20 bg-blue-50 p-4">
            <div className="flex w-full flex-col items-center justify-between gap-4 md:flex-row">
              <div>
                <p className="font-semibold">Période d&apos;essai gratuit</p>
                <p className="text-sm opacity-90">
                  Ton essai gratuit se termine le{" "}
                  <strong>{formattedDate}</strong>. Ton abonnement se
                  renouvellera automatiquement à cette date.
                </p>
              </div>

              <ManageSubscriptionButton variant="outline" />
            </div>
          </div>
        );
      }

      return <></>;
    },
  });
};
