"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import { parseAsString, useQueryState } from "nuqs";
import { ProjectSettingsTab } from "./settings/project-settings-tab.client";
import { ReviewersTab } from "./reviewers/reviewers-tab.client";

interface ProjectTabsProps {
  projectId: string;
}

export function ProjectTabs({ projectId }: ProjectTabsProps) {
  const [tab, setTab] = useQueryState(
    "tab",
    parseAsString.withDefault("overview"),
  );

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList>
        <TabsTrigger value="overview">Vue d&apos;ensemble</TabsTrigger>
        <TabsTrigger value="settings">Paramètres</TabsTrigger>
        <TabsTrigger value="reviewers">Relecteurs</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-6">
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center text-muted-foreground">
          <p className="text-lg font-medium">Boîte de retours</p>
          <p className="text-sm">
            La boîte de retours sera disponible dans une prochaine version.
          </p>
        </div>
      </TabsContent>

      <TabsContent value="settings" className="mt-6">
        <ProjectSettingsTab projectId={projectId} />
      </TabsContent>

      <TabsContent value="reviewers" className="mt-6">
        <ReviewersTab projectId={projectId} />
      </TabsContent>
    </Tabs>
  );
}
