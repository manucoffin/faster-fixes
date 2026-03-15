"use client";

import {
  organization,
  useActiveOrganization,
  useListOrganizations,
} from "@/lib/auth";
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
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

export function LeaveOrganizationSection() {
  const router = useRouter();
  const { data: activeOrg } = useActiveOrganization();
  const { refetch: refetchOrganizations } = useListOrganizations();
  const [open, setOpen] = React.useState(false);

  const leaveOrganization =
    trpc.authenticated.organisation.leave.useMutation({
      onSuccess: async () => {
        toast.success("Vous avez quitté l'organisation");
        setOpen(false);
        await refetchOrganizations();
        const { data: orgs } = await organization.list();
        const firstOrg = orgs?.[0];
        if (firstOrg) {
          await organization.setActive({ organizationId: firstOrg.id });
        }
        router.push(defaultRedirect);
      },
      onError: (error) => {
        toast.error(
          error.message || "Erreur lors de la sortie de l'organisation.",
        );
      },
    });

  return (
    <div className="flex flex-col gap-4">
      <Alert variant="destructive" className="max-w-sm">
        <LogOut />
        <AlertDescription>
          En quittant l&apos;organisation, vous perdrez l&apos;accès à toutes
          ses ressources et données.
        </AlertDescription>
      </Alert>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" className="w-fit self-end">
            Quitter l&apos;organisation
          </Button>
        </AlertDialogTrigger>

        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <LogOut className="h-5 w-5 text-destructive" />
              <AlertDialogTitle>Quitter l&apos;organisation</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="pt-2">
              Vous êtes sur le point de quitter l&apos;organisation{" "}
              <strong>{activeOrg?.name}</strong>. Vous ne pourrez plus accéder à
              ses ressources.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={leaveOrganization.isPending}>
              Annuler
            </AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={leaveOrganization.isPending}
              onClick={() => {
                if (!activeOrg) return;
                leaveOrganization.mutate({
                  organizationId: activeOrg.id,
                });
              }}
            >
              {leaveOrganization.isPending
                ? "Sortie en cours..."
                : "Confirmer la sortie"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
