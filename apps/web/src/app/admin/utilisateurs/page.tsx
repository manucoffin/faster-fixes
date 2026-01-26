import { DashboardPageContent } from "@/app/_features/core/dashboard/dashboard-page-content";
import { Suspense } from "react";
import { UsersTable } from "./_features/users-table/users-table";
import { CreateUserDialog } from "./_features/create-user/create-user-dialog.client";

export default function AdminUsersPage() {
  return (
    <DashboardPageContent
      title="Utilisateurs"
      actions={<CreateUserDialog />}
      breadcrumbs={[
        { label: "Tableau de bord", link: "/admin" },
        { label: "Utilisateurs", link: "/admin/utilisateurs" },
      ]}
    >
      <Suspense>
        <UsersTable />
      </Suspense>
    </DashboardPageContent>
  );
}