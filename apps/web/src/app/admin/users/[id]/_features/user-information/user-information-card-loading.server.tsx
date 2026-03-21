import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Skeleton } from "@workspace/ui/components/skeleton";

export async function UserInformationCardLoading() {
  return (
    <Card className="shadow-none lg:col-span-2">
      <CardHeader>
        <CardTitle>User information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-muted-foreground text-sm">Email</p>
            <Skeleton className="h-5 w-full" />
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Name</p>
            <Skeleton className="h-5 w-4/5" />
          </div>
          <div>
            <p className="text-muted-foreground text-sm">
              User type
            </p>
            <Skeleton className="h-5 w-3/5" />
          </div>
        </div>

        <div className="border-t pt-4">
          <p className="text-muted-foreground mb-2 text-sm">Role</p>
          <Skeleton className="h-6 w-20" />
        </div>

        <div className="border-t pt-4">
          <p className="text-muted-foreground mb-2 text-sm">
            Account details
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-muted-foreground text-sm">
                Onboarding completed
              </p>
              <Skeleton className="h-5 w-24" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">
                Newsletter opted in
              </p>
              <Skeleton className="h-5 w-28" />
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end space-x-4 border-t pt-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-40" />
      </CardFooter>
    </Card>
  );
}
