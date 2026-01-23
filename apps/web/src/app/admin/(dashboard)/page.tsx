import { DashboardPageContent } from "@/app/_features/core/dashboard/dashboard-page-content";
import { ActiveSubscriptionsCard } from "./_features/active-subscriptions-card/active-subscriptions-card.client";
import { MrrCard } from "./_features/mrr-card/mrr-card.client";
import { SubscriptionsChart } from "./_features/subscriptions-chart/subscriptions-chart.client";
import { UsersOverviewCard } from "./_features/users-overview-card/users-overview-card.client";

export default async function AdminDashboardPage() {
  return (
    <DashboardPageContent
      title="Tableau de bord"
      breadcrumbs={[{ label: "Tableau de bord", link: "/admin" }]}
    >
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <UsersOverviewCard />
          <ActiveSubscriptionsCard />
          <MrrCard />
        </div>

        <SubscriptionsChart />
      </div>
    </DashboardPageContent>
  );
}
