import { DashboardPageContent } from "@/app/_components/dashboard/dashboard-page-content";
import { ReceivedInvitationsList } from "./_features/received-invitations-list.client";

export default function InvitationsPage() {
  return (
    <DashboardPageContent
      breadcrumbs={[{ label: "organization" }, { label: "Invitations" }]}
    >
      <ReceivedInvitationsList />
    </DashboardPageContent>
  );
}
