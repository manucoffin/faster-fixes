import { loginUrl } from "@/app/_constants/routes";
import { DashboardPageContent } from "@/app/_features/core/dashboard/dashboard-page-content";
import { auth } from "@/server/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { CurrentPlanCard } from "./_features/current-plan/current-plan-card.client";
import { PastInvoicesCard } from "./_features/past-invoices/past-invoices-card.client";
import { SubscriptionStatusBanner } from "./_features/subscription-status/subscription-status-banner.client";

export default async function BillingPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect(loginUrl);
  }

  const activeOrganization = await auth.api.getFullOrganization({
    headers: await headers(),
  });

  if (!activeOrganization) {
    redirect(loginUrl);
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
            <CurrentPlanCard organizationId={activeOrganization.id} />
          </div>

          <div className="lg:w-2/5">
            <PastInvoicesCard />
          </div>
        </div>
      </div>
    </DashboardPageContent>
  );
}
