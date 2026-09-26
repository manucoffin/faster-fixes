import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Skeleton } from "@workspace/ui/components/skeleton";

export async function AccountCardLoading() {
  return (
    <Card>
      <CardHeader>
        <p className="text-sm text-muted-foreground">Account</p>
        <CardTitle>Account information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Created at</p>
            <Skeleton className="h-5 w-32" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Last updated</p>
            <Skeleton className="h-5 w-32" />
          </div>
        </div>

        <div className="border-t pt-4">
          <p className="mb-2 text-sm text-muted-foreground">Status</p>
          <Skeleton className="h-5 w-32" />
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2 border-t pt-6">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </CardFooter>
    </Card>
  );
}
