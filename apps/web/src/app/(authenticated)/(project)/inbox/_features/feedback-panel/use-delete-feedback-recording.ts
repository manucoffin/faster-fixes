import type { ListFeedbackOutput } from "@/app/(authenticated)/(project)/inbox/_services/list-feedback";
import { useTRPC } from "@/lib/trpc/trpc-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type UseDeleteFeedbackRecordingOptions = {
  projectId: string;
  onDeleted: () => void;
};

export function useDeleteFeedbackRecording({
  projectId,
  onDeleted,
}: UseDeleteFeedbackRecordingOptions) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const listQueryKey = trpc.authenticated.projects.feedback.list.queryKey({
    projectId,
  });

  return useMutation(
    trpc.authenticated.projects.feedback.deleteRecording.mutationOptions({
      onSuccess: async (_result, { feedbackId }) => {
        onDeleted();
        // The detail panel reads the Feedback from the list, so the row goes
        // at once rather than after the refetch.
        queryClient.setQueryData(
          listQueryKey,
          (old: ListFeedbackOutput | undefined) =>
            old?.map((f) =>
              f.id === feedbackId ? { ...f, recording: null } : f,
            ),
        );
        queryClient.removeQueries({
          queryKey: ["recording-events", feedbackId],
        });
        queryClient.removeQueries({
          queryKey:
            trpc.authenticated.projects.feedback.getRecordingPlayback.queryKey({
              feedbackId,
            }),
        });
        toast.success("Recording removed.");
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: listQueryKey }),
          queryClient.invalidateQueries({
            queryKey:
              trpc.authenticated.projects.feedback.listArchived.queryKey({
                projectId,
              }),
          }),
        ]);
      },
      onError: (error) => {
        toast.error(error.message || "Failed to remove recording.");
      },
    }),
  );
}
