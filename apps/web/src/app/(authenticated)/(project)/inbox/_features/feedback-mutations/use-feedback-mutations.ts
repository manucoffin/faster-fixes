import type { ListFeedbackOutput } from "@/app/(authenticated)/(project)/inbox/_services/list-feedback";
import { useActiveProject } from "@/app/_domains/project/active-project/active-project-provider.client";
import { useTRPC } from "@/lib/trpc/trpc-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useFeedbackMutations() {
  const { activeProject } = useActiveProject();
  if (!activeProject) {
    throw new Error("useFeedbackMutations requires an active Project.");
  }
  const projectId = activeProject.id;
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const feedbackQueryKey = trpc.authenticated.projects.feedback.list.queryKey({
    projectId,
  });
  const newCountQueryKey =
    trpc.authenticated.projects.feedback.countNew.queryKey({ projectId });
  // Partial input, so every page, search and sort of the archive table matches.
  const archivedQueryKey =
    trpc.authenticated.projects.feedback.listArchived.queryKey({ projectId });

  // The sidebar badge counts New Feedback, and a status change can move
  // Feedback into the Archive, so every status change refreshes both.
  const invalidateAfterStatusChange = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: feedbackQueryKey }),
      queryClient.invalidateQueries({ queryKey: newCountQueryKey }),
      queryClient.invalidateQueries({ queryKey: archivedQueryKey }),
    ]);

  const updateStatus = useMutation(
    trpc.authenticated.projects.feedback.updateStatus.mutationOptions({
      onMutate: async ({ feedbackId, status }) => {
        await queryClient.cancelQueries({ queryKey: feedbackQueryKey });
        const previous = queryClient.getQueryData(feedbackQueryKey);

        queryClient.setQueryData(
          feedbackQueryKey,
          (old: ListFeedbackOutput | undefined) =>
            old?.map((f) => (f.id === feedbackId ? { ...f, status } : f)),
        );

        return { previous };
      },
      onError: (_err, _vars, context) => {
        if (context?.previous) {
          queryClient.setQueryData(feedbackQueryKey, context.previous);
        }
        toast.error("Failed to update status.");
      },
      onSettled: invalidateAfterStatusChange,
    }),
  );

  const bulkUpdateStatus = useMutation(
    trpc.authenticated.projects.feedback.updateManyStatus.mutationOptions({
      onMutate: async ({ feedbackIds, status }) => {
        await queryClient.cancelQueries({ queryKey: feedbackQueryKey });
        const previous = queryClient.getQueryData(feedbackQueryKey);
        const idSet = new Set(feedbackIds);

        queryClient.setQueryData(
          feedbackQueryKey,
          (old: ListFeedbackOutput | undefined) =>
            old?.map((f) => (idSet.has(f.id) ? { ...f, status } : f)),
        );

        return { previous };
      },
      onError: (_err, _vars, context) => {
        if (context?.previous) {
          queryClient.setQueryData(feedbackQueryKey, context.previous);
        }
        toast.error("Failed to update status.");
      },
      onSettled: invalidateAfterStatusChange,
    }),
  );

  const updateAssignee = useMutation(
    trpc.authenticated.projects.feedback.updateAssignee.mutationOptions({
      onSuccess: () =>
        queryClient.invalidateQueries({ queryKey: feedbackQueryKey }),
      onError: () => {
        toast.error("Failed to update assignee.");
      },
    }),
  );

  return {
    updateStatus: (feedbackId: string, status: string) =>
      updateStatus.mutate({
        feedbackId,
        status: status as "new" | "in_progress" | "resolved" | "closed",
      }),
    bulkUpdateStatus: (feedbackIds: string[], status: string) =>
      bulkUpdateStatus.mutate({
        projectId,
        feedbackIds,
        status: status as "new" | "in_progress" | "resolved" | "closed",
      }),
    updateAssignee: (feedbackId: string, assigneeId: string | null) =>
      updateAssignee.mutate({ feedbackId, assigneeId }),
  };
}
