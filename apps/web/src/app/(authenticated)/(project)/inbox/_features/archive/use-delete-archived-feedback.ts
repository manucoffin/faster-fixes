import { getBulkDeleteNotice } from "@/app/(authenticated)/(project)/inbox/_helpers/archive-deletion";
import { useTRPC } from "@/lib/trpc/trpc-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type UseDeleteArchivedFeedbackOptions = {
  projectId: string;
  onDeleted: (deleted: number) => void;
};

export function useDeleteArchivedFeedback({
  projectId,
  onDeleted,
}: UseDeleteArchivedFeedbackOptions) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const invalidateArchive = () =>
    queryClient.invalidateQueries({
      queryKey: trpc.authenticated.projects.feedback.listArchived.queryKey({
        projectId,
      }),
    });

  const deleteOne = useMutation(
    trpc.authenticated.projects.feedback.delete.mutationOptions({
      onSuccess: async () => {
        onDeleted(1);
        await invalidateArchive();
        toast.success("Feedback deleted.");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to delete feedback.");
      },
    }),
  );

  const deleteMany = useMutation(
    trpc.authenticated.projects.feedback.deleteMany.mutationOptions({
      onSuccess: async (result) => {
        onDeleted(result.deleted);
        await invalidateArchive();
        const notice = getBulkDeleteNotice(result);
        toast[notice.tone](notice.message);
      },
      onError: (error) => {
        toast.error(error.message || "Failed to delete feedback.");
      },
    }),
  );

  return {
    deleteOne: (feedbackId: string) => deleteOne.mutate({ feedbackId }),
    deleteMany: (feedbackIds: string[]) =>
      deleteMany.mutate({ projectId, feedbackIds }),
    isPending: deleteOne.isPending || deleteMany.isPending,
  };
}
