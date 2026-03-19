"use client";

import { defaultRedirect } from "@/app/_constants";
import {
  organization,
  useActiveOrganization,
  useListOrganizations,
} from "@/lib/auth";
import { useTRPC } from "@/lib/trpc/trpc-client";
import { useMutation } from "@tanstack/react-query";
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
  const trpc = useTRPC();
  const router = useRouter();
  const { data: activeOrg } = useActiveOrganization();
  const { refetch: refetchOrganizations } = useListOrganizations();
  const [open, setOpen] = React.useState(false);

  const leaveOrganization = useMutation(
    trpc.authenticated.organisation.leave.mutationOptions({
      onSuccess: async () => {
        toast.success("You have left the organization");
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
        toast.error(error.message || "Error leaving the organization.");
      },
    }),
  );

  return (
    <div className="flex flex-col gap-4">
      <Alert variant="destructive" className="max-w-sm">
        <LogOut />
        <AlertDescription>
          By leaving the organization, you will lose access to all its resources
          and data.
        </AlertDescription>
      </Alert>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" className="w-fit self-end">
            Leave organization
          </Button>
        </AlertDialogTrigger>

        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <LogOut className="text-destructive h-5 w-5" />
              <AlertDialogTitle>Quitter l&apos;organisation</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="pt-2">
              You are about to leave the organization{" "}
              <strong>{activeOrg?.name}</strong>. You will no longer have access
              to its resources.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={leaveOrganization.isPending}>
              Cancel
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
              {leaveOrganization.isPending ? "Leaving..." : "Confirm leave"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
