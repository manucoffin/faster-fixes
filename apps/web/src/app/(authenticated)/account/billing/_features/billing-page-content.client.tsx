"use client";

import { DashboardPageContent } from "@/app/_features/core/dashboard/dashboard-page-content";
import { PlanSelection } from "@/app/_features/subscription/upgrade-subscription/plan-selection.client";
import { usePlanGate } from "@/app/_features/subscription/use-plan-gate";
import { CurrentPlanCard } from "./current-plan/current-plan-card.client";
import { PastInvoicesCard } from "./past-invoices/past-invoices-card.client";
import { SubscriptionStatusBanner } from "./subscription-status/subscription-status-banner.client";

interface BillingPageContentProps {
  organizationId: string;
}

export function BillingPageContent({
  organizationId,
}: BillingPageContentProps) {
  const { isFreePlan } = usePlanGate();

  if (isFreePlan) {
    return (
      <DashboardPageContent
        title="Subscribe"
        breadcrumbs={[{ label: "My Account" }, { label: "Subscribe" }]}
      >
        <p className="text-muted-foreground mb-6">
          Select the plan that best fits your needs.
        </p>
        <div className="max-w-3xl">
          <PlanSelection />
        </div>
      </DashboardPageContent>
    );
  }

  return (
    <DashboardPageContent
      title="Billing"
      breadcrumbs={[{ label: "My Account" }, { label: "Billing" }]}
    >
      <SubscriptionStatusBanner />

      <div className="mt-4">
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="lg:w-3/5">
            <CurrentPlanCard organizationId={organizationId} />
          </div>

          <div className="lg:w-2/5">
            <PastInvoicesCard />
          </div>
        </div>
      </div>
    </DashboardPageContent>
  );
}
