"use client";

import { organization, useActiveOrganization } from "@/lib/auth";
import { defaultRedirect } from "@/lib/routing";
import { trpc } from "@/lib/trpc/trpc-client";
import { Alert, AlertDescription } from "@workspace/ui/components/alert";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog";
import { Button } from "@workspace/ui/components/button";
import { AlertTriangleIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

export function DeleteOrganizationSection() {
  const router = useRouter();
  const { data: activeOrg } = useActiveOrganization();
  const [open, setOpen] = React.useState(false);
  const [isPending, setIsPending] = React.useState(false);

  const orgDetailsQuery =
    trpc.authenticated.account.organisation.getOrganizationDetails.useQuery(
      { organizationId: activeOrg?.id ?? "" },
      { enabled: !!activeOrg?.id },
    );

  const isDefault = orgDetailsQuery.data?.isDefault ?? false;

  const handleDelete = async () => {
    if (!activeOrg) return;

    setIsPending(true);
    try {
      const result = await organization.delete({
        organizationId: activeOrg.id,
      });

      if (result.error) {
        toast.error(
          result.error.message ||
            "Erreur lors de la suppression de l'organisation.",
        );
        return;
      }

      toast.success("Organisation supprimée avec succès");
      setOpen(false);
      router.push(defaultRedirect);
    } catch {
      toast.error("Une erreur inattendue s'est produite.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Alert variant="destructive" className="max-w-sm">
        <AlertTriangleIcon />
        <AlertDescription>
          {isDefault
            ? "L'organisation par défaut ne peut pas être supprimée."
            : "La suppression de l'organisation est irréversible. Toutes les données associées seront perdues."}
        </AlertDescription>
      </Alert>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" className="w-fit" disabled={isDefault}>
            Supprimer l&apos;organisation
          </Button>
        </AlertDialogTrigger>

        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <AlertTriangleIcon className="h-5 w-5 text-destructive" />
              <AlertDialogTitle>
                Supprimer l&apos;organisation
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="pt-2">
              Cette action est irréversible. Toutes les données de
              l&apos;organisation <strong>{activeOrg?.name}</strong> seront
              supprimées définitivement.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={isPending}
              onClick={handleDelete}
            >
              {isPending
                ? "Suppression en cours..."
                : "Confirmer la suppression"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
