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
      toast.success("Success", {
        description: "User deleted successfully",
      });
      queryClient.invalidateQueries(trpc.admin.users.list.queryFilter());
      router.push("/admin/users");
    },
    onError: (error) => {
      toast.error("Error", {
        description: error.message || "An error occurred",
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
          Delete account
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Are you sure you want to delete this user?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This action is irreversible. It will delete the user account and all
            associated data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteUserMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteUserMutation.isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
