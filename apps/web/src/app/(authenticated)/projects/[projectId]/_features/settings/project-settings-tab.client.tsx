"use client";

import { DashboardSection } from "@/app/(authenticated)/_features/dashboard/dashboard-section";

import { DeleteProjectButton } from "./delete/delete-project-button.client";
import { RegenerateApiKeySection } from "./regenerate-api-key/regenerate-api-key-section.client";
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
        title="API Key"
        description="Used by the widget to submit feedback. Only the last 4 characters are shown."
        cardTitle="API Key"
        cardClassName="lg:max-w-lg"
      >
        <RegenerateApiKeySection projectId={projectId} />
      </DashboardSection>

      <DashboardSection
        title="Danger zone"
        description="Deletion is permanent and irreversible."
        cardTitle="Delete project"
        cardClassName="lg:max-w-lg"
      >
        <DeleteProjectButton projectId={projectId} />
      </DashboardSection>
    </div>
  );
}
