"use client";

import { useTRPC } from "@/lib/trpc/trpc-client";
import { useQuery } from "@tanstack/react-query";
import { SubscriptionStatus } from "@/server/auth/config/subscription-plans";
import { matchQueryStatus } from "@/utils/tanstack-query/match-query-status";
import { ManageSubscriptionButton } from "../manage-subscription/manage-subscription-button.client";

export const SubscriptionStatusBanner = () => {
  const trpc = useTRPC();

  const getSubscriptionStatusQuery =
    useQuery(trpc.authenticated.account.billing.subscription.status.queryOptions());

  const formatDate = (date: string | Date) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-US", {
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
                <p className="font-semibold">Subscription canceled</p>
                <p className="text-sm opacity-90">
                  Your subscription will end on{" "}
                  <strong>{formattedDate}</strong>. You will lose access to
                  premium features after this date.
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
                <p className="font-semibold">Free trial</p>
                <p className="text-sm opacity-90">
                  Your free trial ends on{" "}
                  <strong>{formattedDate}</strong>. Your subscription will
                  automatically renew on this date.
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
