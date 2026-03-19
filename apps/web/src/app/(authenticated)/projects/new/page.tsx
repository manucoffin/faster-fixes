import { DashboardPageContent } from "@/app/_features/core/dashboard/dashboard-page-content";
import { DashboardSection } from "@/app/(authenticated)/_features/dashboard/dashboard-section";
import { CreateProjectForm } from "./_features/create-project-form.client";

export default function NouveauProjetPage() {
  return (
    <DashboardPageContent
      title="New project"
      breadcrumbs={[
        { label: "Projects", link: "/projects" },
        { label: "New" },
      ]}
    >
      <DashboardSection
        title="Create a project"
        description="A project corresponds to a client site. Each project has its own API key and its own reviewers."
        cardTitle="New project"
        cardClassName="lg:max-w-lg"
      >
        <CreateProjectForm />
      </DashboardSection>
    </DashboardPageContent>
  );
}
