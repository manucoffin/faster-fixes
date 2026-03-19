import { DashboardPageContent } from "@/app/_features/core/dashboard/dashboard-page-content";
import { Button } from "@workspace/ui/components/button";
import { Plus } from "lucide-react";
import { CreateProjectDialog } from "./_features/create/create-project-dialog.client";
import { ProjectList } from "./_features/list/project-list.client";

export default function ProjetsPage() {
  return (
    <DashboardPageContent
      title="Projects"
      breadcrumbs={[{ label: "Projects" }]}
      actions={
        <CreateProjectDialog>
          <Button size="sm">
            <Plus className="size-4" />
            New project
          </Button>
        </CreateProjectDialog>
      }
    >
      <ProjectList />
    </DashboardPageContent>
  );
}
