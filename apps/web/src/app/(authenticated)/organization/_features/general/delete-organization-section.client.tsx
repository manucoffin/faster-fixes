"use client";

import { defaultRedirect } from "@/app/_constants/routes";
import type { GetOrganizationDetailsOutput } from "@/app/(authenticated)/organization/_services/get-organization-details";
import { organization, useActiveOrganization } from "@/lib/auth";
import { useTRPC } from "@/lib/trpc/trpc-client";
import { getErrorMessage } from "@/utils/error/get-error-message";
import { matchQueryStatus } from "@/utils/tanstack-query/match-query-status";
import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert";
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
import { Skeleton } from "@workspace/ui/components/skeleton";
import { AlertTriangleIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

function DeleteOrganizationSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-16 max-w-sm" />
      <Skeleton className="h-9 w-40 self-end" />
    </div>
  );
}

export function DeleteOrganizationSection() {
  const trpc = useTRPC();
  const { data: activeOrg } = useActiveOrganization();

  const organizationQuery = useQuery(
    trpc.authenticated.organization.get.queryOptions(
      { organizationId: activeOrg?.id ?? "" },
      { enabled: !!activeOrg?.id },
    ),
  );

  return matchQueryStatus(organizationQuery, {
    Loading: <DeleteOrganizationSkeleton />,
    Errored: (error) => (
      <Alert variant="destructive" className="max-w-sm">
        <AlertTriangleIcon />
        <AlertTitle>Failed to load the organization</AlertTitle>
        <AlertDescription>{getErrorMessage(error)}</AlertDescription>
      </Alert>
    ),
    // The read waits for the active Organization, so it is idle rather than
    // loading until that session query resolves.
    Empty: <DeleteOrganizationSkeleton />,
    Success: ({ data }) => <DeleteOrganizationCard organization={data} />,
  });
}

type DeleteOrganizationCardProps = {
  organization: GetOrganizationDetailsOutput;
};

function DeleteOrganizationCard({
  organization: currentOrganization,
}: DeleteOrganizationCardProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [isPending, setIsPending] = React.useState(false);

  const isDefault = currentOrganization.isDefault;

  const handleDelete = async () => {
    setIsPending(true);
    try {
      const result = await organization.delete({
        organizationId: currentOrganization.id,
      });

      if (result.error) {
        // An empty message falls back too, so the toast is never blank.
        const { message } = result.error;
        toast.error(
          message === undefined || message === ""
            ? "Error deleting organization."
            : message,
        );
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
              <AlertTriangleIcon className="h-5 w-5 text-destructive" />
              <AlertDialogTitle>Delete organization</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="pt-2">
              This action is irreversible. All data for the organization{" "}
              <strong>{currentOrganization.name}</strong> will be permanently
              deleted.
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
