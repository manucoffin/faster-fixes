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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import {
  LogOut,
  Mail,
  MoreHorizontal,
  Plus,
  Shield,
  UserMinus,
  X,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { InviteMemberDialog } from "./invite-member-dialog.client";

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

type Invitation = {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: Date;
};

export function OrganizationMembersTab() {
  const { data: session } = useSession();
  const { data: activeOrg } = useActiveOrganization();
  const { data: memberRoleData } = useActiveMemberRole();
  const [pendingAction, setPendingAction] = React.useState<string | null>(null);
  const [inviteDialogOpen, setInviteDialogOpen] = React.useState(false);
  const [invitations, setInvitations] = React.useState<Invitation[]>([]);

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

  const loadInvitations = React.useCallback(async () => {
    if (!activeOrg?.id || !canManage) return;
    try {
      const result = await organization.listInvitations({
        query: { organizationId: activeOrg.id },
      });
      if (result.data) {
        const pending = (result.data as Invitation[]).filter(
          (inv) => inv.status === "pending",
        );
        setInvitations(pending);
      }
    } catch {
      // Silently fail
    }
  }, [activeOrg?.id, canManage]);

  React.useEffect(() => {
    loadInvitations();
  }, [loadInvitations]);

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

  const handleCancelInvitation = async (invitationId: string) => {
    setPendingAction(invitationId);
    try {
      const result = await organization.cancelInvitation({
        invitationId,
      });

      if (result.error) {
        toast.error(
          result.error.message ||
            "Erreur lors de l'annulation de l'invitation.",
        );
        return;
      }

      toast.success("Invitation annulée");
      loadInvitations();
    } catch {
      toast.error("Une erreur inattendue s'est produite.");
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {canManage && (
        <div className="flex justify-end">
          <Button onClick={() => setInviteDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Inviter un membre
          </Button>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Membre</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Rôle</TableHead>
            <TableHead>Statut</TableHead>
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
                  <Badge variant="outline" className="text-muted-foreground">
                    Actif
                  </Badge>
                </TableCell>
                <TableCell>
                  {isCurrentUser && !isMemberOwner && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={pendingAction === "leave"}
                      onClick={handleLeave}
                    >
                      <LogOut className="mr-1 h-4 w-4" />
                      Quitter
                    </Button>
                  )}
                  {canManage && !isCurrentUser && !isMemberOwner && (
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
                      <Mail className="h-4 w-4" />
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
                <Badge variant={getRoleBadgeVariant(invitation.role)}>
                  {getRoleLabel(invitation.role)}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">En attente</Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={pendingAction === invitation.id}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onSelect={() => handleCancelInvitation(invitation.id)}
                      className="text-destructive"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Annuler l&apos;invitation
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}

          {(!members || members.length === 0) && invitations.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-muted-foreground text-center py-8">
                Aucun membre
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <InviteMemberDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        onInviteSent={loadInvitations}
      />
    </div>
  );
}
