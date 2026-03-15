"use client";

import { getRoleLabel } from "@/app/_features/organization/_utils/organization-roles";
import { trpc } from "@/lib/trpc/trpc-client";
import { matchQueryStatus } from "@/utils/tanstack-query/match-query-status";
import { Badge } from "@workspace/ui/components/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@workspace/ui/components/empty";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { AcceptInvitationButton } from "./accept-invitation/accept-invitation-button.client";
import { RejectInvitationButton } from "./reject-invitation/reject-invitation-button.client";

function LoadingSkeleton() {
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

export function ReceivedInvitationsList() {
  const invitationsQuery =
    trpc.authenticated.organisation.invitation.getReceived.useQuery();

  return matchQueryStatus(invitationsQuery, {
    Loading: <LoadingSkeleton />,
    Errored: (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Erreur</EmptyTitle>
          <EmptyDescription>
            Impossible de charger les invitations.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    ),
    Empty: (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Aucune invitation</EmptyTitle>
          <EmptyDescription>
            Vous n&apos;avez aucune invitation en attente.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    ),
    Success: ({ data }) => (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((invitation) => (
          <Card key={invitation.id}>
            <CardHeader>
              <CardTitle className="text-base">
                {invitation.organization.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Organisation :</span>
                  <span>{invitation.organization.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Rôle :</span>
                  <Badge variant="outline">
                    {getRoleLabel(invitation.role ?? "member")}
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
              <AcceptInvitationButton
                invitationId={invitation.id}
                organizationId={invitation.organizationId}
              />
              <RejectInvitationButton invitationId={invitation.id} />
            </CardFooter>
          </Card>
        ))}
      </div>
    ),
  });
}
