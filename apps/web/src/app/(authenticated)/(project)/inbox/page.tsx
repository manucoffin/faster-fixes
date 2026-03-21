import { DashboardPageContent } from "@/app/_features/core/dashboard/dashboard-page-content";
import { InboxContent } from "./_features/inbox-content.client";

export default function Page() {
  return (
    <DashboardPageContent breadcrumbs={[{ label: "Inbox" }]}>
      <InboxContent />
    </DashboardPageContent>
  );
}
