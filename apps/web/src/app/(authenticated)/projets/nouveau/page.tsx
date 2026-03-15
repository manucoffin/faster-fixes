import { DashboardPageContent } from "@/app/_features/core/dashboard/dashboard-page-content";
import { DashboardSection } from "@/app/(authenticated)/_features/dashboard/dashboard-section";
import { CreateProjectForm } from "./_features/create-project-form.client";

export default function NouveauProjetPage() {
  return (
    <DashboardPageContent
      title="Nouveau projet"
      breadcrumbs={[
        { label: "Projets", link: "/projets" },
        { label: "Nouveau" },
      ]}
    >
      <DashboardSection
        title="Créer un projet"
        description="Un projet correspond à un site client. Chaque projet possède sa propre clé API et ses propres relecteurs."
        cardTitle="Nouveau projet"
        cardClassName="lg:max-w-lg"
      >
        <CreateProjectForm />
      </DashboardSection>
    </DashboardPageContent>
  );
}
