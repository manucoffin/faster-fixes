import { DashboardPageContent } from "@/app/_features/core/dashboard/dashboard-page-content";
import { Button } from "@workspace/ui/components/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { ProjectList } from "./_features/list/project-list.client";

export default function ProjetsPage() {
  return (
    <DashboardPageContent
      title="Projects"
      breadcrumbs={[{ label: "Projects" }]}
      actions={
        <Button asChild>
          <Link href="/projets/nouveau">
            <Plus className="mr-2 h-4 w-4" />
            New project
          </Link>
        </Button>
      }
    >
      <ProjectList />
    </DashboardPageContent>
  );
}
