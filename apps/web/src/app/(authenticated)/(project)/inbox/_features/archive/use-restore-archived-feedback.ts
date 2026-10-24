import { getArchiveBulkNotice } from "@/app/(authenticated)/(project)/inbox/_helpers/archive-bulk-notice";
import { useTRPC } from "@/lib/trpc/trpc-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type UseRestoreArchivedFeedbackOptions = {
  projectId: string;
  onRestored: (restored: number) => void;
};

export function useRestoreArchivedFeedback({
  projectId,
  onRestored,
}: UseRestoreArchivedFeedbackOptions) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // A restored Feedback leaves the Archive and lands in the board as New, so
  // the board list and the sidebar badge refresh along with the archive table.
  const invalidateAfterRestore = () =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: trpc.authenticated.projects.feedback.listArchived.queryKey({
          projectId,
        }),
      }),
      queryClient.invalidateQueries({
        queryKey: trpc.authenticated.projects.feedback.list.queryKey({
          projectId,
        }),
      }),
      queryClient.invalidateQueries({
        queryKey: trpc.authenticated.projects.feedback.countNew.queryKey({
          projectId,
        }),
      }),
    ]);

  const restoreMany = useMutation(
    trpc.authenticated.projects.feedback.restoreMany.mutationOptions({
      onSuccess: async (result) => {
        onRestored(result.restored);
        await invalidateAfterRestore();
        const notice = getArchiveBulkNotice({
          action: "restored",
          count: result.restored,
          requested: result.requested,
        });
        toast[notice.tone](notice.message);
      },
      onError: (error) => {
        toast.error(error.message || "Failed to restore feedback.");
      },
    }),
  );

  return {
    restoreOne: (feedbackId: string) =>
      restoreMany.mutate({ projectId, feedbackIds: [feedbackId] }),
    restoreMany: (feedbackIds: string[]) =>
      restoreMany.mutate({ projectId, feedbackIds }),
    isPending: restoreMany.isPending,
  };
}
