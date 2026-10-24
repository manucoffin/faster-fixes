import type { ListFeedbackOutput } from "@/app/(authenticated)/(project)/inbox/_services/list-feedback";
import { planRankPlacement } from "@/app/(authenticated)/(project)/inbox/_helpers/feedback-rank-placement";
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

  const move = useMutation(
    trpc.authenticated.projects.feedback.move.mutationOptions({
      onMutate: async ({ feedbackId, status, beforeId, afterId }) => {
        await queryClient.cancelQueries({ queryKey: feedbackQueryKey });
        const previous =
          queryClient.getQueryData<ListFeedbackOutput>(feedbackQueryKey);

        // The server recomputes the keys from fresh data. These only place the
        // card until the list refetches.
        if (previous) {
          const writes = planRankPlacement({
            column: previous.filter((f) => f.status === status),
            movedId: feedbackId,
            beforeId,
            afterId,
          });
          const keys = new Map(writes.map((w) => [w.feedbackId, w.key]));
          queryClient.setQueryData(
            feedbackQueryKey,
            previous.map((f) => {
              const key = keys.get(f.id);
              const moved = f.id === feedbackId ? { ...f, status } : f;
              return key === undefined ? moved : { ...moved, rank: key };
            }),
          );
        }

        return { previous };
      },
      onError: (_err, _vars, context) => {
        if (context?.previous) {
          queryClient.setQueryData(feedbackQueryKey, context.previous);
        }
        toast.error("Failed to move feedback.");
      },
      // A move to another column is a Status change, so the New count may move.
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
    moveFeedback: (
      feedbackId: string,
      status: string,
      beforeId: string | null,
      afterId: string | null,
    ) =>
      move.mutate({
        projectId,
        feedbackId,
        status: status as "new" | "in_progress" | "resolved",
        beforeId,
        afterId,
      }),
    updateAssignee: (feedbackId: string, assigneeId: string | null) =>
      updateAssignee.mutate({ feedbackId, assigneeId }),
  };
}
