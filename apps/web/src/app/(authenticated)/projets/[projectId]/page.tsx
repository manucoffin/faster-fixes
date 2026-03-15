import { DashboardPageContent } from "@/app/_features/core/dashboard/dashboard-page-content";
import { PageParams } from "@/types/next";
import { ProjectTabs } from "./_features/project-tabs.client";

export default async function ProjetPage({
  params,
}: PageParams<{ projectId: string }>) {
  const { projectId } = await params;

  return (
    <DashboardPageContent
      breadcrumbs={[
        { label: "Projects", link: "/projets" },
        { label: "Project" },
      ]}
    >
      <ProjectTabs projectId={projectId} />
    </DashboardPageContent>
  );
}
