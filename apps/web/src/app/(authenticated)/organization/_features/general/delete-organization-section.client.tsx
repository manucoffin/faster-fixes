"use client";

import { defaultRedirect } from "@/app/_constants";
import { organization, useActiveO@/app/_constants/routesom "@/lib/auth";
import { useTRPC } from "@/lib/trpc/trpc-client";
import { useQuery } from "@tanstack/react-query";
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
  const trpc = useTRPC();
  const router = useRouter();
  const { data: activeOrg } = useActiveOrganization();
  const [open, setOpen] = React.useState(false);
  const [isPending, setIsPending] = React.useState(false);

  const orgDetailsQuery = useQuery(
    trpc.authenticated.organisation.get.queryOptions(
      { organizationId: activeOrg?.id ?? "" },
      { enabled: !!activeOrg?.id },
    ),
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
        toast.error(result.error.message || "Error deleting organization.");
        return;
      }

      toast.success("Organization deleted successfully");
      setOpen(false);
      router.push(defaultRedirect);
    } catch {
      toast.error("An unexpected error occurred.");
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
            ? "The default organization cannot be deleted."
            : "Deleting the organization is irreversible. All associated data will be lost."}
        </AlertDescription>
      </Alert>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <Button
            variant="destructive"
            className="w-fit self-end"
            disabled={isDefault}
          >
            Delete organization
          </Button>
        </AlertDialogTrigger>

        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <AlertTriangleIcon className="text-destructive h-5 w-5" />
              <AlertDialogTitle>Delete organization</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="pt-2">
              This action is irreversible. All data for the organization{" "}
              <strong>{activeOrg?.name}</strong> will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={isPending}
              onClick={handleDelete}
            >
              {isPending ? "Deleting..." : "Confirm deletion"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
