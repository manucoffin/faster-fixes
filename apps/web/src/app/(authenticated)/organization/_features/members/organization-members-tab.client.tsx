"use client";

import { getRoleLabel } from "@/app/_domains/organization/_helpers/organization-roles";
import {
  useActiveMemberRole,
  useActiveOrganization,
  useSession,
} from "@/lib/auth";
import { useTRPC } from "@/lib/trpc/trpc-client";
import { resolveS3Url } from "@/utils/url/resolve-s3-url";
import { getErrorMessage } from "@/utils/error/get-error-message";
import { matchQueryStatus } from "@/utils/tanstack-query/match-query-status";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { Facehash } from "facehash";
import { LogOut, Mail } from "lucide-react";
import { toast } from "sonner";
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

  const currentRole = memberRoleData?.role;

  const members = activeOrg?.members;

  const canManage = currentRole === "owner" || currentRole === "admin";
  const isOwner = currentRole === "owner";

  const invitationsQuery = useQuery(
    trpc.authenticated.organization.invitation.list.queryOptions(
      { organizationId: activeOrg?.id ?? "" },
      { enabled: !!activeOrg?.id && canManage },
    ),
  );

  // A failed invitation read owns its own row, so the empty state must not
  // claim the organization has no member at the same time. A count rather than
  // an empty-array fallback: the rows themselves come from `matchQueryStatus`
  // below, which keeps the error state distinct from "nothing to show".
  const invitationCount = invitationsQuery.data?.length ?? 0;

  const hasNoRows =
    (!members || members.length === 0) &&
    invitationCount === 0 &&
    // eslint-disable-next-line local/no-query-status-branch -- derives a boolean for the empty row, the rows themselves go through matchQueryStatus
    !invitationsQuery.isError;

  const leaveOrganization = useMutation(
    trpc.authenticated.organization.leave.mutationOptions({
      onSuccess: async () => {
        await refetchActiveOrg();
        toast.success("You have left the organization");
      },
      onError: (error) => {
        toast.error(error.message || "Error leaving the organization.");
      },
    }),
  );

  const handleLeave = () => {
    if (!activeOrg) return;
    leaveOrganization.mutate({ organizationId: activeOrg.id });
  };

  return (
    <div className="flex flex-col gap-6">
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
                          src={
                            member.user.image.startsWith("http")
                              ? member.user.image
                              : resolveS3Url(member.user.image)
                          }
                          alt={memberName}
                        />
                      )}
                      <AvatarFallback>
                        <Facehash name={member.user.email} size={32} />
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

          {matchQueryStatus(invitationsQuery, {
            Loading: (
              <TableRow>
                <TableCell colSpan={5}>
                  <Skeleton className="h-8 w-full" />
                </TableCell>
              </TableRow>
            ),
            Errored: (error) => (
              <TableRow>
                <TableCell colSpan={5} className="text-sm text-destructive">
                  Failed to load the pending invitations.{" "}
                  {getErrorMessage(error)}
                </TableCell>
              </TableRow>
            ),
            // No pending invitation, or a member who cannot manage them: the
            // member rows above are the whole table.
            Empty: <></>,
            Success: ({ data }) => (
              <>
                {data.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            <Mail className="size-4" />
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-muted-foreground">
                          {invitation.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {invitation.email}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getRoleBadgeVariant(
                          invitation.role ?? "member",
                        )}
                      >
                        {getRoleLabel(invitation.role ?? "member")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">Pending</Badge>
                    </TableCell>
                    <TableCell>
                      <InvitationActionsDropdown invitationId={invitation.id} />
                    </TableCell>
                  </TableRow>
                ))}
              </>
            ),
          })}

          {hasNoRows && (
            <TableRow>
              <TableCell
                colSpan={5}
                className="py-8 text-center text-muted-foreground"
              >
                No members
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
