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
        { label: "Dashboard", link: "/admin" },
        { label: "Users", link: "/admin/users" },
      ]}
    >
      <Suspense>
        <UsersTable />
      </Suspense>
    </DashboardPageContent>
  );
}