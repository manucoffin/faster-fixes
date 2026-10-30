import { DashboardPageContent } from "@/app/_components/dashboard/dashboard-page-content";
import { isCloud } from "@/utils/environment/env";
import { HeadlineStrip } from "@/app/admin/_components/headline-strip";
import { ActivationFunnelCard } from "./_features/activation-funnel-card/activation-funnel-card.client";
import { AdoptionCard } from "./_features/adoption-card/adoption-card.client";
import { CollectedRevenueCard } from "./_features/collected-revenue-card/collected-revenue-card.client";
import { EngagedOrganizationsCard } from "./_features/engaged-organizations-card/engaged-organizations-card.client";
import { FeedbackSummary } from "./_features/feedback-summary.client";
import { MonthlyGrowthChart } from "./_features/monthly-growth-chart/monthly-growth-chart.client";
import { MrrCard } from "./_features/mrr-card/mrr-card.client";
import { PayingOrganizationsCard } from "./_features/paying-organizations-card/paying-organizations-card.client";
import { RetentionCard } from "./_features/retention-card.client";

export default async function AdminDashboardPage() {
  return (
    <DashboardPageContent
      breadcrumbs={[{ label: "Dashboard", link: "/admin" }]}
    >
      <div className="space-y-4">
        <HeadlineStrip>
          {isCloud() && (
            <>
              <MrrCard />
              <CollectedRevenueCard />
              <PayingOrganizationsCard />
            </>
          )}
          <EngagedOrganizationsCard />
        </HeadlineStrip>

        {isCloud() && (
          <div className="grid gap-4 lg:grid-cols-3">
            <RetentionCard />
            <ActivationFunnelCard />
            <AdoptionCard />
          </div>
        )}

        <FeedbackSummary />

        {isCloud() && <MonthlyGrowthChart />}
      </div>
    </DashboardPageContent>
  );
}
