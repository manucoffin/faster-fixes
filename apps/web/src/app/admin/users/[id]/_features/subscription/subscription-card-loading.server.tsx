import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Skeleton } from "@workspace/ui/components/skeleton";

export function SubscriptionCardLoading() {
  return (
    <Card className="shadow-none lg:col-span-2">
      <CardHeader>
        <CardTitle>Current subscription</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Subscription plan</p>
              <Skeleton className="mt-2 h-6 w-32" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Skeleton className="mt-2 h-6 w-20" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Period end</p>
              <Skeleton className="mt-2 h-6 w-40" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
