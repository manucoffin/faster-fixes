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
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export const StopImpersonateButton = () => {
  const trpc = useTRPC();
  const router = useRouter();
  const { data: session, refetch: refetchSession } = useSession();

  const stopImpersonateMutation = useMutation(trpc.auth.stopImpersonate.mutationOptions({
    onSuccess: async () => {
      toast.success("Success", {
        description: "You have returned to your admin account",
      });
      await refetchSession();
      router.push("/admin");
    },
    onError: (error) => {
      toast.error("Error", {
        description:
          error.message || "Failed to stop impersonation",
      });
    },
  }));

  const handleStopImpersonate = () => {
    stopImpersonateMutation.mutate();
  };

  // Only show button if user is being impersonated
  const isImpersonated = !!session?.session?.impersonatedBy;

  if (!isImpersonated) {
    return null;
  }

  return (
    <div className="-translation-y-1/2 fixed top-1/2 right-4 z-40">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            size="icon"
            variant="destructive"
            disabled={stopImpersonateMutation.isPending}
            title="Stop impersonation"
          >
            <LogOut className="size-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Stop impersonation?
            </AlertDialogTitle>
            <AlertDialogDescription>
              You will return to your admin account. Access to the account of
              user {session?.user?.email} will be revoked.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStopImpersonate}
              disabled={stopImpersonateMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {stopImpersonateMutation.isPending
                ? "Stopping..."
                : "Stop impersonation"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
