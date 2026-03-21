"use client";

import { useSession } from "@/lib/auth";
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
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type ImpersonateUserButtonProps = {
  userId: string;
  userEmail: string;
};

export const ImpersonateUserButton = ({
  userId,
  userEmail,
}: ImpersonateUserButtonProps) => {
  const trpc = useTRPC();
  const router = useRouter();
  const { refetch: refetchSession } = useSession();

  const impersonateUserMutation =
    useMutation(trpc.admin.users.impersonate.mutationOptions({
      onSuccess: async () => {
        toast.success("Success", {
          description: `You are now signed in as ${userEmail}`,
        });
        await refetchSession();
        router.push("/");
      },
      onError: (error) => {
        toast.error("Error", {
          description:
            error.message ||
            "Failed to impersonate this user",
        });
      },
    }));

  const handleImpersonate = () => {
    impersonateUserMutation.mutate({ userId });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" disabled={impersonateUserMutation.isPending}>
          Impersonate
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Are you sure you want to impersonate this user?
          </AlertDialogTitle>
          <AlertDialogDescription>
            You will be signed in as {userEmail}. You will be able to use the
            application as this user.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleImpersonate}
            disabled={impersonateUserMutation.isPending}
          >
            {impersonateUserMutation.isPending
              ? "Impersonating..."
              : "Impersonate"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
