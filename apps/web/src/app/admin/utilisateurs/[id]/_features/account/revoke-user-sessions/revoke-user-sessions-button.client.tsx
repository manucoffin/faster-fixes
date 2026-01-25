"use client";

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
import { toast } from "sonner";

type RevokeUserSessionsButtonProps = {
  userId: string;
};

export const RevokeUserSessionsButton = ({
  userId,
}: RevokeUserSessionsButtonProps) => {
  const revokeSessionsMutation =
    trpc.admin.users.details.revokeUserSessions.useMutation({
      onSuccess: () => {
        toast.success("Succès", {
          description: "Toutes les sessions utilisateur ont été révoquées",
        });
      },
      onError: (error) => {
        toast.error("Erreur", {
          description:
            error.message || "Impossible de révoquer les sessions utilisateur",
        });
      },
    });

  const handleRevoke = () => {
    revokeSessionsMutation.mutate({ userId });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" disabled={revokeSessionsMutation.isPending}>
          Déconnecter de tous les appareils
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Déconnecter l&apos;utilisateur de tous les appareils ?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Cette action déconnectera l&apos;utilisateur de toutes ses sessions
            actives sur tous les appareils. L&apos;utilisateur devra se
            reconnecter pour accéder à son compte.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleRevoke}
            disabled={revokeSessionsMutation.isPending}
          >
            {revokeSessionsMutation.isPending
              ? "Déconnexion..."
              : "Déconnecter"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
