"use client";

import { SubscriptionStatusTranslation } from "@/app/_features/subscription/_constants/translations";
import { useTRPC } from "@/lib/trpc/trpc-client";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@workspace/ui/components/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Loader2 } from "lucide-react";
import { SubscriptionCreateDialog } from "./subscription-create-dialog.client";
import { SubscriptionEditDialog } from "./subscription-edit-dialog.client";

interface SubscriptionCardProps {
  userId: string;
}

export function SubscriptionCard({ userId }: SubscriptionCardProps) {
  const trpc = useTRPC();
  const { data: subscription, isLoading } =
    useQuery(trpc.admin.users.subscription.get.queryOptions(
      { userId },
      {
        enabled: !!userId,
      },
    ));

  if (isLoading) {
    return (
      <Card className="">
        <CardHeader>
          <p className="text-muted-foreground text-sm">Abonnement</p>
          <CardTitle>Chargement...</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="">
      <CardHeader>
        <p className="text-muted-foreground text-sm">Abonnement</p>

        <CardTitle>{subscription ? subscription.plan : "Non abonné"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {subscription ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-muted-foreground text-sm">Statut</p>
                <Badge
                  variant={
                    subscription.status === "active" ? "default" : "secondary"
                  }
                >
                  {subscription.status &&
                    SubscriptionStatusTranslation[
                    subscription.status as keyof typeof SubscriptionStatusTranslation
                    ]}
                </Badge>
              </div>
              {subscription.periodEnd && (
                <div>
                  <p className="text-muted-foreground text-sm">Jusqu&apos;au</p>
                  <p className="font-medium">
                    {format(new Date(subscription.periodEnd), "PPP", {
                      locale: fr,
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Aucun abonnement actif
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="justify-end">
        {subscription ? (
          <SubscriptionEditDialog userId={userId} subscription={subscription} />
        ) : (
          <SubscriptionCreateDialog userId={userId} />
        )}
      </CardFooter>
    </Card>
  );
}
