"use client";

import { getRoleLabel } from "@/app/_features/organization/_utils/organization-roles";
import { organization } from "@/lib/auth";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from "@workspace/ui/components/empty";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { Check, X } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

type Invitation = {
  id: string;
  organizationId: string;
  organizationName: string;
  role: string;
  status: string;
  inviterId: string;
  expiresAt: Date;
};

export function ReceivedInvitationsList() {
  const [invitations, setInvitations] = React.useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [pendingAction, setPendingAction] = React.useState<string | null>(null);

  const loadInvitations = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await organization.listUserInvitations();
      if (result.data) {
        const pending = (result.data as Invitation[]).filter(
          (inv) => inv.status === "pending",
        );
        setInvitations(pending);
      }
    } catch {
      // Silently fail
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadInvitations();
  }, [loadInvitations]);

  const handleAccept = async (invitationId: string) => {
    setPendingAction(invitationId);
    try {
      const result = await organization.acceptInvitation({
        invitationId,
      });

      if (result.error) {
        toast.error(
          result.error.message ||
            "Erreur lors de l'acceptation de l'invitation.",
        );
        return;
      }

      toast.success("Invitation acceptée");

      const invitation = invitations.find((inv) => inv.id === invitationId);
      if (invitation) {
        await organization.setActive({
          organizationId: invitation.organizationId,
        });
      }

      loadInvitations();
    } catch {
      toast.error("Une erreur inattendue s'est produite.");
    } finally {
      setPendingAction(null);
    }
  };

  const handleReject = async (invitationId: string) => {
    setPendingAction(invitationId);
    try {
      const result = await organization.rejectInvitation({
        invitationId,
      });

      if (result.error) {
        toast.error(
          result.error.message || "Erreur lors du refus de l'invitation.",
        );
        return;
      }

      toast.success("Invitation refusée");
      loadInvitations();
    } catch {
      toast.error("Une erreur inattendue s'est produite.");
    } finally {
      setPendingAction(null);
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            </CardContent>
            <CardFooter>
              <Skeleton className="h-9 w-full" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Aucune invitation</EmptyTitle>
          <EmptyDescription>
            Vous n&apos;avez aucune invitation en attente.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {invitations.map((invitation) => (
        <Card key={invitation.id}>
          <CardHeader>
            <CardTitle className="text-base">
              {invitation.organizationName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Organisation :</span>
                <span>{invitation.organizationName}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Rôle :</span>
                <Badge variant="outline">
                  {getRoleLabel(invitation.role)}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Expire le :</span>
                <span>
                  {new Date(invitation.expiresAt).toLocaleDateString("fr-FR")}
                </span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button
              size="sm"
              disabled={pendingAction === invitation.id}
              onClick={() => handleAccept(invitation.id)}
              className="flex-1"
            >
              <Check className="mr-1 h-4 w-4" />
              Accepter
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pendingAction === invitation.id}
              onClick={() => handleReject(invitation.id)}
              className="flex-1"
            >
              <X className="mr-1 h-4 w-4" />
              Refuser
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
