"use client";

import { useActiveProject } from "@/app/_features/project/active-project-provider.client";
import { useTRPC } from "@/lib/trpc/trpc-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type DeleteProjectButtonProps = {
  projectId: string;
};

export function DeleteProjectButton({ projectId }: DeleteProjectButtonProps) {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { activeProject, clearActiveProject } = useActiveProject();
  const [confirmationText, setConfirmationText] = useState("");

  const { data: project } = useQuery(
    trpc.authenticated.projects.get.queryOptions({ projectId }),
  );

  const deleteProject = useMutation(
    trpc.authenticated.projects.delete.mutationOptions({
      onSuccess: () => {
        if (activeProject?.id === projectId) {
          clearActiveProject();
        }
        queryClient.invalidateQueries({
          queryKey: trpc.authenticated.projects.list.queryKey(),
        });
        router.push("/inbox");
        toast.success("Project deleted");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const projectName = project?.name ?? "";
  const isConfirmed = confirmationText === projectName && projectName !== "";

  return (
    <AlertDialog onOpenChange={() => setConfirmationText("")}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="self-end">
          <Trash2 className="size-4" />
          Delete project
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete project?</AlertDialogTitle>
          <AlertDialogDescription>
            This action is irreversible. All reviewers, feedback, and associated
            files will be permanently deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="confirm-delete">
            Type <span className="font-semibold">{projectName}</span> to confirm
          </Label>
          <Input
            id="confirm-delete"
            value={confirmationText}
            onChange={(e) => setConfirmationText(e.target.value)}
            placeholder={projectName}
            autoComplete="off"
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deleteProject.mutate({ projectId })}
            variant="destructive"
            disabled={!isConfirmed}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
