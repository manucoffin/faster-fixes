"use client";

import { useTRPC } from "@/lib/trpc/trpc-client";
import { useMutation } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog";
import { Button } from "@workspace/ui/components/button";
import { toast } from "sonner";

type RevokeUserSessionsButtonProps = {
  userId: string;
};

export const RevokeUserSessionsButton = ({
  userId,
}: RevokeUserSessionsButtonProps) => {
  const trpc = useTRPC();
  const revokeSessionsMutation =
    useMutation(trpc.admin.users.sessions.revoke.mutationOptions({
      onSuccess: () => {
        toast.success("Success", {
          description: "All user sessions have been revoked",
        });
      },
      onError: (error) => {
        toast.error("Error", {
          description:
            error.message || "Failed to revoke user sessions",
        });
      },
    }));

  const handleRevoke = () => {
    revokeSessionsMutation.mutate({ userId });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" disabled={revokeSessionsMutation.isPending}>
          Sign out from all devices
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Sign out user from all devices?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This will sign the user out of all active sessions across all
            devices. The user will need to sign in again to access their
            account.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleRevoke}
            disabled={revokeSessionsMutation.isPending}
          >
            {revokeSessionsMutation.isPending
              ? "Signing out..."
              : "Sign out"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
