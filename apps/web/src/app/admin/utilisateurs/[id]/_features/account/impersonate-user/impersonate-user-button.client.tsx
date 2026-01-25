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
  const router = useRouter();
  const { refetch: refetchSession } = useSession();

  const impersonateUserMutation =
    trpc.admin.users.details.impersonateUser.useMutation({
      onSuccess: async () => {
        toast.success("Succès", {
          description: `Vous êtes maintenant connecté en tant que ${userEmail}`,
        });
        await refetchSession();
        router.push("/");
      },
      onError: (error) => {
        toast.error("Erreur", {
          description:
            error.message ||
            "Impossible d'emprunter l'identité de cet utilisateur",
        });
      },
    });

  const handleImpersonate = () => {
    impersonateUserMutation.mutate({ userId });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" disabled={impersonateUserMutation.isPending}>
          Emprunter l&apos;identité
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Êtes-vous sûr de vouloir emprunter l&apos;identité de cet
            utilisateur ?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Vous serez connecté en tant que {userEmail}. Vous pourrez utiliser
            l&apos;application en tant que cet utilisateur.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleImpersonate}
            disabled={impersonateUserMutation.isPending}
          >
            {impersonateUserMutation.isPending
              ? "Emprunt en cours..."
              : "Emprunter l'identité"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
