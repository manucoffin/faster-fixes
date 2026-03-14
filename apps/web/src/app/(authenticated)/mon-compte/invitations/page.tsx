import { DashboardPageContent } from "@/app/_features/core/dashboard/dashboard-page-content";
import { ReceivedInvitationsList } from "./_features/received-invitations-list.client";

export default function InvitationsPage() {
  return (
    <DashboardPageContent
      breadcrumbs={[
        { label: "Mon compte" },
        { label: "Invitations" },
      ]}
    >
      <ReceivedInvitationsList />
    </DashboardPageContent>
  );
}
