import type { ListFeedbackOutput } from "@/app/(authenticated)/(project)/inbox/_services/list-feedback";
import { useActiveProject } from "@/app/_domains/project/active-project/active-project-provider.client";
import { useTRPC } from "@/lib/trpc/trpc-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// Mirrors the database trigger (ADR-0017): a Status change clears the Rank, so
// the card lands on top of its new column before the list refetches.
function withStatus(feedback: ListFeedbackOutput[number], status: string) {
  if (feedback.status === status) return feedback;
  return { ...feedback, status, rank: null };
}

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

  // The sidebar badge counts New Feedback, so every status change refreshes it.
  const invalidateAfterStatusChange = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: feedbackQueryKey }),
      queryClient.invalidateQueries({ queryKey: newCountQueryKey }),
    ]);

  const updateStatus = useMutation(
    trpc.authenticated.projects.feedback.updateStatus.mutationOptions({
      onMutate: async ({ feedbackId, status }) => {
        await queryClient.cancelQueries({ queryKey: feedbackQueryKey });
        const previous = queryClient.getQueryData(feedbackQueryKey);

        queryClient.setQueryData(
          feedbackQueryKey,
          (old: ListFeedbackOutput | undefined) =>
            old?.map((f) => (f.id === feedbackId ? withStatus(f, status) : f)),
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
            old?.map((f) => (idSet.has(f.id) ? withStatus(f, status) : f)),
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
