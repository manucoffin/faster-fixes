"use client";

import {
  getRoleLabel,
  type OrganizationRole,
} from "@/app/_features/organization/_utils/organization-roles";
import {
  organization,
  useActiveOrganization,
  useActiveMemberRole,
  useSession,
} from "@/lib/auth";
import { getInitials } from "@/utils/text/get-initials";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
} from "@workspace/ui/components/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { LogOut, MoreHorizontal, Shield, UserMinus } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

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
  const { data: session } = useSession();
  const { data: activeOrg } = useActiveOrganization();
  const { data: memberRoleData } = useActiveMemberRole();
  const [pendingAction, setPendingAction] = React.useState<string | null>(null);

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

  const handleUpdateRole = async (
    memberId: string,
    newRole: OrganizationRole,
  ) => {
    setPendingAction(memberId);
    try {
      const result = await organization.updateMemberRole({
        memberId,
        role: newRole,
      });

      if (result.error) {
        toast.error(
          result.error.message || "Erreur lors de la modification du rôle.",
        );
        return;
      }

      toast.success("Rôle mis à jour avec succès");
    } catch {
      toast.error("Une erreur inattendue s'est produite.");
    } finally {
      setPendingAction(null);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    setPendingAction(memberId);
    try {
      const result = await organization.removeMember({
        memberIdOrEmail: memberId,
      });

      if (result.error) {
        toast.error(
          result.error.message || "Erreur lors du retrait du membre.",
        );
        return;
      }

      toast.success("Membre retiré avec succès");
    } catch {
      toast.error("Une erreur inattendue s'est produite.");
    } finally {
      setPendingAction(null);
    }
  };

  const handleLeave = async () => {
    if (!activeOrg) return;

    setPendingAction("leave");
    try {
      const result = await organization.leave({
        organizationId: activeOrg.id,
      });

      if (result.error) {
        toast.error(
          result.error.message ||
            "Erreur lors de la sortie de l'organisation.",
        );
        return;
      }

      toast.success("Vous avez quitté l'organisation");
    } catch {
      toast.error("Une erreur inattendue s'est produite.");
    } finally {
      setPendingAction(null);
    }
  };

  if (!members || members.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Aucun membre</EmptyTitle>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Membre</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Rôle</TableHead>
          <TableHead className="w-[80px]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member) => {
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
                        src={member.user.image}
                        alt={memberName}
                      />
                    )}
                    <AvatarFallback className="text-xs">
                      {getInitials(memberName)}
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
                {isCurrentUser && !isMemberOwner ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={pendingAction === "leave"}
                    onClick={handleLeave}
                  >
                    <LogOut className="mr-1 h-4 w-4" />
                    Quitter
                  </Button>
                ) : canManage && !isCurrentUser && !isMemberOwner ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={pendingAction === member.id}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {isOwner && member.role !== "admin" && (
                        <DropdownMenuItem
                          onSelect={() =>
                            handleUpdateRole(member.id, "admin")
                          }
                        >
                          <Shield className="mr-2 h-4 w-4" />
                          Promouvoir administrateur
                        </DropdownMenuItem>
                      )}
                      {isOwner && member.role === "admin" && (
                        <DropdownMenuItem
                          onSelect={() =>
                            handleUpdateRole(member.id, "member")
                          }
                        >
                          <Shield className="mr-2 h-4 w-4" />
                          Rétrograder en membre
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onSelect={() => handleRemoveMember(member.id)}
                        className="text-destructive"
                      >
                        <UserMinus className="mr-2 h-4 w-4" />
                        Retirer le membre
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : null}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
