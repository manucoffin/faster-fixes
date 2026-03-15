import { DashboardPageContent } from "@/app/_features/core/dashboard/dashboard-page-content";
import { OrganizationTabs } from "./_features/organization-tabs.client";

export default function OrganisationPage() {
  return (
    <DashboardPageContent breadcrumbs={[{ label: "Organisation" }]}>
      <OrganizationTabs />
    </DashboardPageContent>
  );
}
