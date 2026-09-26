"use client";

import { getSubscriptionStatusLabel } from "@/app/_domains/subscription/_helpers/get-subscription-status-label";
import { useTRPC } from "@/lib/trpc/trpc-client";
import { getErrorMessage } from "@/utils/error/get-error-message";
import { matchQueryStatus } from "@/utils/tanstack-query/match-query-status";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@workspace/ui/components/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { format } from "date-fns";
import { SubscriptionCreateDialog } from "./subscription-create-dialog.client";
import { SubscriptionEditDialog } from "./subscription-edit-dialog.client";

type SubscriptionCardProps = {
  userId: string;
};

export function SubscriptionCard({ userId }: SubscriptionCardProps) {
  const trpc = useTRPC();
  const subscriptionQuery = useQuery(
    trpc.admin.users.subscription.get.queryOptions(
      { userId },
      {
        enabled: !!userId,
      },
    ),
  );

  return matchQueryStatus(subscriptionQuery, {
    Loading: (
      <Card>
        <CardHeader>
          <p className="text-sm text-muted-foreground">Subscription</p>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Skeleton className="h-10 w-full" />
        </CardContent>
        <CardFooter className="justify-end">
          <Skeleton className="h-9 w-28" />
        </CardFooter>
      </Card>
    ),
    Errored: (error) => (
      <Card>
        <CardHeader>
          <p className="text-sm text-muted-foreground">Subscription</p>
          <CardTitle>Failed to load the subscription</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{getErrorMessage(error)}</p>
        </CardContent>
      </Card>
    ),
    // The service returns null for a free account, so this is the "no
    // subscription" state rather than a failure.
    Empty: (
      <Card>
        <CardHeader>
          <p className="text-sm text-muted-foreground">Subscription</p>
          <CardTitle>Not subscribed</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No active subscription
          </p>
        </CardContent>
        <CardFooter className="justify-end">
          <SubscriptionCreateDialog userId={userId} />
        </CardFooter>
      </Card>
    ),
    Success: ({ data: subscription }) => (
      <Card>
        <CardHeader>
          <p className="text-sm text-muted-foreground">Subscription</p>
          <CardTitle>{subscription.plan}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge
                variant={
                  subscription.status === "active" ? "default" : "secondary"
                }
              >
                {subscription.status &&
                  getSubscriptionStatusLabel(subscription.status)}
              </Badge>
            </div>
            {subscription.periodEnd && (
              <div>
                <p className="text-sm text-muted-foreground">Until</p>
                <p className="font-medium">
                  {format(new Date(subscription.periodEnd), "PPP")}
                </p>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <SubscriptionEditDialog userId={userId} subscription={subscription} />
        </CardFooter>
      </Card>
    ),
  });
}
