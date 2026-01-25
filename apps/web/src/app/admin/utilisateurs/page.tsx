import { DashboardPageContent } from "@/app/_features/core/dashboard/dashboard-page-content";
import { Button } from "@workspace/ui/components/button";
import { Link, Plus } from "lucide-react";
import { Suspense } from "react";
import { UsersTable } from "./_features/users-table/users-table";

export default function AdminUsersPage() {
  return (
    <DashboardPageContent
      title="Utilisateurs"
      actions={
        <Button asChild variant="outline">
          <Link href="/admin/utilisateurs/new">
            <Plus />
            Ajouter un utilisateur
          </Link>
        </Button>
      }
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