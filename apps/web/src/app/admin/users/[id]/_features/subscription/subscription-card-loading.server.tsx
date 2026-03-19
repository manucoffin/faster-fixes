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
        <CardTitle>Abonnement actuel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-muted-foreground text-sm">
                Plan d&apos;abonnement
              </p>
              <Skeleton className="h-6 w-32 mt-2" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Statut</p>
              <Skeleton className="h-6 w-20 mt-2" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Fin de la période</p>
              <Skeleton className="h-6 w-40 mt-2" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
