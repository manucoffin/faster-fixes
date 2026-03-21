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

type RequestPasswordResetButtonProps = {
  userId: string;
};

export const RequestPasswordResetButton = ({
  userId,
}: RequestPasswordResetButtonProps) => {
  const trpc = useTRPC();
  const requestPasswordResetMutation =
    useMutation(trpc.admin.users.password.requestReset.mutationOptions({
      onSuccess: () => {
        toast.success("Success", {
          description:
            "A password reset email has been sent to the user",
        });
      },
      onError: (error) => {
        toast.error("Error", {
          description:
            error.message ||
            "Failed to send password reset link",
        });
      },
    }));

  const handleRequestReset = () => {
    requestPasswordResetMutation.mutate({ userId });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          disabled={requestPasswordResetMutation.isPending}
        >
          Reset password
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Send a password reset link?
          </AlertDialogTitle>
          <AlertDialogDescription>
            An email with a password reset link will be sent to the user. The
            user will then be able to create a new password.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleRequestReset}
            disabled={requestPasswordResetMutation.isPending}
          >
            {requestPasswordResetMutation.isPending
              ? "Sending..."
              : "Send"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
