"use client";

import { canManageMembers } from "@/app/_features/organization/_utils/organization-roles";
import { useActiveMemberRole } from "@/lib/auth";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import { OrganizationGeneralTab } from "./general/organization-general-tab.client";
import { OrganizationInvitationsTab } from "./invitations/organization-invitations-tab.client";
import { OrganizationMembersTab } from "./members/organization-members-tab.client";

export function OrganizationTabs() {
  const { data: memberRole } = useActiveMemberRole();

  const showManagementTabs = canManageMembers(memberRole?.role ?? "");

  return (
    <Tabs defaultValue="general">
      <TabsList>
        <TabsTrigger value="general">Général</TabsTrigger>
        {showManagementTabs && (
          <>
            <TabsTrigger value="members">Membres</TabsTrigger>
            <TabsTrigger value="invitations">Invitations</TabsTrigger>
          </>
        )}
      </TabsList>

      <TabsContent value="general" className="mt-6">
        <OrganizationGeneralTab />
      </TabsContent>

      {showManagementTabs && (
        <>
          <TabsContent value="members" className="mt-6">
            <OrganizationMembersTab />
          </TabsContent>

          <TabsContent value="invitations" className="mt-6">
            <OrganizationInvitationsTab />
          </TabsContent>
        </>
      )}
    </Tabs>
  );
}
