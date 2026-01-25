"use client";

import { useSession } from "@/lib/auth";
import { trpc } from "@/lib/trpc/trpc-client";
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
  const router = useRouter();
  const { data: session, refetch: refetchSession } = useSession();

  const stopImpersonateMutation = trpc.auth.stopImpersonate.useMutation({
    onSuccess: async () => {
      toast.success("Succès", {
        description: "Vous êtes revenu à votre compte administrateur",
      });
      await refetchSession();
      router.push("/admin");
    },
    onError: (error) => {
      toast.error("Erreur", {
        description:
          error.message || "Impossible d'arrêter l'emprunt d'identité",
      });
    },
  });

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
            title="Arrêter l'emprunt d'identité"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Arrêter l&apos;emprunt d&apos;identité ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Vous allez retourner à votre compte administrateur. L&apos;accès
              au compte de l&apos;utilisateur {session?.user?.email} sera
              révoqué.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStopImpersonate}
              disabled={stopImpersonateMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {stopImpersonateMutation.isPending
                ? "Arrêt en cours..."
                : "Arrêter l'emprunt"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
