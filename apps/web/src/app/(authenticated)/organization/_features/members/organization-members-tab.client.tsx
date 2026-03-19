"use client";

import { getRoleLabel } from "@/app/_features/organization/_utils/organization-roles";
import {
  useActiveMemberRole,
  useActiveOrganization,
  useSession,
} from "@/lib/auth";
import { useTRPC } from "@/lib/trpc/trpc-client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { resolveS3Url } from "@/server/storage/resolve-s3-url";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import { Facehash } from "facehash";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { LogOut, Mail, Plus } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { InviteMemberDialog } from "./create-invitation/invite-member-dialog.client";
import { InvitationActionsDropdown } from "./invitation-actions-dropdown.client";
import { MemberActionsDropdown } from "./member-actions-dropdown.client";

function getRoleBadgeVariant(role: string) {
  switch (role) {
    case "owner":
      return "default" as const;
    case "admin":
      return "secondary" as const;
    default:
      return "outline" as const;
  }
}

export function OrganizationMembersTab() {
  const trpc = useTRPC();
  const { data: session } = useSession();
  const { data: activeOrg, refetch: refetchActiveOrg } =
    useActiveOrganization();
  const { data: memberRoleData } = useActiveMemberRole();
  const [inviteDialogOpen, setInviteDialogOpen] = React.useState(false);

  const currentRole = memberRoleData?.role;

  const members = (activeOrg as Record<string, unknown>)?.members as
    | Array<{
        id: string;
        userId: string;
        role: string;
        user: { id: string; name: string; email: string; image?: string };
      }>
    | undefined;

  const canManage = currentRole === "owner" || currentRole === "admin";
  const isOwner = currentRole === "owner";

  const invitationsQuery =
    useQuery(trpc.authenticated.organisation.invitation.get.queryOptions(
      { organizationId: activeOrg?.id ?? "" },
      { enabled: !!activeOrg?.id && canManage },
    ));

  const invitations = invitationsQuery.data ?? [];

  const leaveOrganization = useMutation(trpc.authenticated.organisation.leave.mutationOptions({
    onSuccess: async () => {
      await refetchActiveOrg();
      toast.success("You have left the organization");
    },
    onError: (error) => {
      toast.error(
        error.message || "Error leaving the organization.",
      );
    },
  }));

  const handleLeave = () => {
    if (!activeOrg) return;
    leaveOrganization.mutate({ organizationId: activeOrg.id });
  };

  return (
    <div className="flex flex-col gap-6">
      {canManage && (
        <div className="flex justify-end">
          <Button onClick={() => setInviteDialogOpen(true)}>
            <Plus className="size-4" />
            Invite member
          </Button>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members?.map((member) => {
            const isCurrentUser = member.userId === session?.user.id;
            const isMemberOwner = member.role === "owner";
            const memberName = member.user.name || member.user.email;

            return (
              <TableRow key={member.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      {member.user.image && (
                        <AvatarImage
                          src={member.user.image.startsWith("http") ? member.user.image : resolveS3Url(member.user.image)}
                          alt={memberName}
                        />
                      )}
                      <AvatarFallback>
                        <Facehash name={member.user.email ?? memberName} size={32} />
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{memberName}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {member.user.email}
                </TableCell>
                <TableCell>
                  <Badge variant={getRoleBadgeVariant(member.role)}>
                    {getRoleLabel(member.role)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-muted-foreground">
                    Active
                  </Badge>
                </TableCell>
                <TableCell>
                  {isCurrentUser && !isMemberOwner && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={leaveOrganization.isPending}
                      onClick={handleLeave}
                    >
                      <LogOut className="mr-1 size-4" />
                      Leave
                    </Button>
                  )}
                  {canManage && !isCurrentUser && !isMemberOwner && (
                    <MemberActionsDropdown
                      memberId={member.id}
                      memberRole={member.role}
                      isOwner={isOwner}
                    />
                  )}
                </TableCell>
              </TableRow>
            );
          })}

          {invitations.map((invitation) => (
            <TableRow key={invitation.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      <Mail className="size-4" />
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-muted-foreground font-medium">
                    {invitation.email}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {invitation.email}
              </TableCell>
              <TableCell>
                <Badge
                  variant={getRoleBadgeVariant(invitation.role ?? "member")}
                >
                  {getRoleLabel(invitation.role ?? "member")}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">Pending</Badge>
              </TableCell>
              <TableCell>
                <InvitationActionsDropdown
                  invitationId={invitation.id}
                />
              </TableCell>
            </TableRow>
          ))}

          {(!members || members.length === 0) && invitations.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-muted-foreground py-8 text-center"
              >
                No members
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <InviteMemberDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
      />
    </div>
  );
}
