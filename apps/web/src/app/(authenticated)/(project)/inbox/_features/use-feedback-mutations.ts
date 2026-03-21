import { GetFeedbackOutput } from "@/app/(authenticated)/(project)/inbox/_features/get-feedback.trpc.query";
import { useActiveProject } from "@/app/_features/project/active-project-provider.client";
import { useTRPC } from "@/lib/trpc/trpc-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useFeedbackMutations() {
  const { activeProject } = useActiveProject();
  const projectId = activeProject!.id;
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const feedbackQueryKey = trpc.authenticated.projects.feedback.list.queryKey({
    projectId,
  });

  const updateStatus = useMutation(
    trpc.authenticated.projects.feedback.updateStatus.mutationOptions({
      onMutate: async ({ feedbackId, status }) => {
        await queryClient.cancelQueries({ queryKey: feedbackQueryKey });
        const previous = queryClient.getQueryData(feedbackQueryKey);

        queryClient.setQueryData(
          feedbackQueryKey,
          (old: GetFeedbackOutput | undefined) =>
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
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: feedbackQueryKey });
      },
    }),
  );

  const bulkUpdateStatus = useMutation(
    trpc.authenticated.projects.feedback.bulkUpdateStatus.mutationOptions({
      onMutate: async ({ feedbackIds, status }) => {
        await queryClient.cancelQueries({ queryKey: feedbackQueryKey });
        const previous = queryClient.getQueryData(feedbackQueryKey);
        const idSet = new Set(feedbackIds);

        queryClient.setQueryData(
          feedbackQueryKey,
          (old: GetFeedbackOutput | undefined) =>
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
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: feedbackQueryKey });
      },
    }),
  );

  const updateAssignee = useMutation(
    trpc.authenticated.projects.feedback.updateAssignee.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: feedbackQueryKey });
      },
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
        feedbackIds,
        status: status as "new" | "in_progress" | "resolved" | "closed",
      }),
    updateAssignee: (feedbackId: string, assigneeId: string | null) =>
      updateAssignee.mutate({ feedbackId, assigneeId }),
  };
}
