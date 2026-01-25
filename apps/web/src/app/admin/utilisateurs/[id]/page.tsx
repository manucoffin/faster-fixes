import { DashboardPageContent } from "@/app/_features/core/dashboard/dashboard-page-content";

export default async function AdminUserPage() {
  return (
    <DashboardPageContent
      title="Utilisateur"
      breadcrumbs={[
        { label: "Tableau de bord", link: "/admin" },
        { label: "Utilisateurs", link: "/admin/utilisateurs" },
        { label: "Détails", },
      ]}
    >
      Someting
    </DashboardPageContent>
  );
}