"use client";

import { useTRPC } from "@/lib/trpc/trpc-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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

type DeleteUserButtonProps = {
  userId: string;
};

export const DeleteUserButton = ({ userId }: DeleteUserButtonProps) => {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();

  const deleteUserMutation = useMutation(trpc.admin.users.delete.mutationOptions({
    onSuccess: () => {
      toast.success("Succès", {
        description: "Utilisateur supprimé avec succès",
      });
      queryClient.invalidateQueries(trpc.admin.users.list.queryFilter());
      router.push("/admin/utilisateurs");
    },
    onError: (error) => {
      toast.error("Erreur", {
        description: error.message || "Une erreur est survenue",
      });
    },
  }));

  const handleDelete = () => {
    deleteUserMutation.mutate({ userId });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          disabled={deleteUserMutation.isPending}
        >
          Supprimer le compte
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Êtes-vous sûr de vouloir supprimer cet utilisateur ?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Cette action est irréversible. Cette suppression supprimera le
            compte utilisateur et supprimera toutes les données associées de nos
            serveurs.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteUserMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteUserMutation.isPending ? "Suppression..." : "Supprimer"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
