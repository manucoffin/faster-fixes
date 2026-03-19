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
        toast.success("Succès", {
          description:
            "Un email de réinitialisation de mot de passe a été envoyé à l'utilisateur",
        });
      },
      onError: (error) => {
        toast.error("Erreur", {
          description:
            error.message ||
            "Impossible d'envoyer le lien de réinitialisation de mot de passe",
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
          Réinitialiser le mot de passe
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Envoyer un lien de réinitialisation de mot de passe ?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Un email contenant un lien de réinitialisation de mot de passe sera
            envoyé à l&apos;utilisateur. L&apos;utilisateur pourra alors créer
            un nouveau mot de passe.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleRequestReset}
            disabled={requestPasswordResetMutation.isPending}
          >
            {requestPasswordResetMutation.isPending
              ? "Envoi en cours..."
              : "Envoyer"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
