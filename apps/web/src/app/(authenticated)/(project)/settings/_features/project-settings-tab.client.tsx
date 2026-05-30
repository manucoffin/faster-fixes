"use client";

import { DashboardSection } from "@/app/(authenticated)/_features/dashboard/dashboard-section";
import { Alert, AlertDescription } from "@workspace/ui/components/alert";
import { AlertTriangleIcon } from "lucide-react";

import { ApiKeyMigrationNotice } from "./api-key-migration-notice.client";
import { DeleteProjectButton } from "./delete/delete-project-button.client";
import { GitHubSection } from "./github/github-section.client";
import { LinearSection } from "./linear/linear-section.client";
import { UpdateProjectForm } from "./update/update-project-form.client";

type ProjectSettingsTabProps = {
  projectId: string;
};

export function ProjectSettingsTab({ projectId }: ProjectSettingsTabProps) {
  return (
    <div className="flex flex-col gap-12">
      <DashboardSection
        title="Project information"
        description="Edit the name, URL, and widget configuration."
        cardTitle="General settings"
        cardClassName="lg:max-w-lg"
      >
        <UpdateProjectForm projectId={projectId} />
      </DashboardSection>

      <DashboardSection
        title="API key"
        description="API keys are deprecated. The widget now authenticates with your Project ID."
        cardTitle="API key (deprecated)"
        cardClassName="lg:max-w-lg"
      >
        <ApiKeyMigrationNotice projectId={projectId} />
      </DashboardSection>

      <DashboardSection
        title="GitHub"
        description="Link a GitHub repository to automatically create issues from feedback."
        cardTitle="GitHub integration"
        cardClassName="lg:max-w-lg"
      >
        <GitHubSection projectId={projectId} />
      </DashboardSection>

      <DashboardSection
        title="Linear"
        description="Link a Linear team to mirror feedback into Linear as issues."
        cardTitle="Linear integration"
        cardClassName="lg:max-w-lg"
      >
        <LinearSection projectId={projectId} />
      </DashboardSection>

      <DashboardSection
        title="Danger zone"
        description="Deletion is permanent and irreversible."
        cardTitle="Delete project"
        cardClassName="lg:max-w-lg"
      >
        <div className="flex flex-col gap-4">
          <Alert variant="destructive">
            <AlertTriangleIcon />
            <AlertDescription>
              Warning: deleting this project is irreversible. All reviewers,
              feedback, and associated files will be permanently deleted.
            </AlertDescription>
          </Alert>
          <DeleteProjectButton projectId={projectId} />
        </div>
      </DashboardSection>
    </div>
  );
}
