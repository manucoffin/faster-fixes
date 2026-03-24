"use client";

import { DashboardSection } from "@/app/(authenticated)/_features/dashboard/dashboard-section";
import { canManageMembers } from "@/app/_features/organization/_utils/organization-roles";
import { useActiveMemberRole } from "@/lib/auth";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import { parseAsString, useQueryState } from "nuqs";
import { CreateAgentTokenDialog } from "./agent-tokens/create-agent-token-dialog.client";
import { AgentTokensSection } from "./agent-tokens/agent-tokens-section.client";
import { OrganizationGeneralTab } from "./general/organization-general-tab.client";
import { OrganizationIntegrationsTab } from "./integrations/organization-integrations-tab.client";
import { LeaveOrganizationSection } from "./leave-organization/leave-organization-section.client";
import { InviteMemberButton } from "./members/invite-member-button.client";
import { OrganizationMembersTab } from "./members/organization-members-tab.client";

export function OrganizationTabs() {
  const { data: memberRole } = useActiveMemberRole();
  const [tab, setTab] = useQueryState(
    "tab",
    parseAsString.withDefault("general"),
  );

  const showManagementTabs = canManageMembers(memberRole?.role ?? "");

  if (!showManagementTabs) {
    return (
      <div className="flex flex-col gap-12">
        <DashboardSection
          title="Leave organization"
          description="Leave this organization if you no longer wish to be a member"
          cardTitle="Leave organization"
          cardClassName="lg:max-w-md"
        >
          <LeaveOrganizationSection />
        </DashboardSection>
      </div>
    );
  }

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="agent-tokens">Agent tokens</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        {tab === "members" && <InviteMemberButton />}
        {tab === "agent-tokens" && <CreateAgentTokenDialog />}
      </div>

      <TabsContent value="general" className="mt-6">
        <OrganizationGeneralTab />
      </TabsContent>

      <TabsContent value="members" className="mt-6">
        <OrganizationMembersTab />
      </TabsContent>

      <TabsContent value="agent-tokens" className="mt-6">
        <AgentTokensSection />
      </TabsContent>

      <TabsContent value="integrations" className="mt-6">
        <OrganizationIntegrationsTab />
      </TabsContent>
    </Tabs>
  );
}
