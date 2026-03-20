"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import { parseAsString, useQueryState } from "nuqs";
import { InboxTab } from "./inbox/inbox-tab.client";
import { ReviewersTab } from "./reviewers/reviewers-tab.client";
import { ProjectSettingsTab } from "./settings/project-settings-tab.client";

type ProjectTabsProps = {
  projectId: string;
};

export function ProjectTabs({ projectId }: ProjectTabsProps) {
  const [tab, setTab] = useQueryState(
    "tab",
    parseAsString.withDefault("inbox"),
  );

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList>
        <TabsTrigger value="inbox">Inbox</TabsTrigger>
        <TabsTrigger value="reviewers">Reviewers</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>

      <TabsContent value="inbox" className="mt-6">
        <InboxTab projectId={projectId} />
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
