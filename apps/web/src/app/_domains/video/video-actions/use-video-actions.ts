import { useTRPC } from "@/lib/trpc/trpc-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type UseVideoActionsOptions = {
  videoId: string;
  projectId: string;
};

// The writes on one Video, shared by the Video page header and the Videos list
// row menu. Each one refreshes the page and the list, which show the same
// title, link and annotations state.
export function useVideoActions({
  videoId,
  projectId,
}: UseVideoActionsOptions) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const refreshVideo = () =>
    Promise.all([
      queryClient.invalidateQueries(
        trpc.authenticated.projects.video.get.queryFilter({ videoId }),
      ),
      queryClient.invalidateQueries(
        trpc.authenticated.projects.video.list.queryFilter({ projectId }),
      ),
    ]);

  const renameMutation = useMutation(
    trpc.authenticated.projects.video.rename.mutationOptions({
      onSettled: () => refreshVideo(),
    }),
  );

  const replaceShareLinkMutation = useMutation(
    trpc.authenticated.projects.video.replaceShareLink.mutationOptions({
      onSuccess: () => toast.success("Link rotated"),
      onError: (error) => toast.error(error.message),
      onSettled: () => refreshVideo(),
    }),
  );

  const setAnnotationsOpenMutation = useMutation(
    trpc.authenticated.projects.video.setAnnotationsOpen.mutationOptions({
      onError: (error) => toast.error(error.message),
      onSettled: () => refreshVideo(),
    }),
  );

  // The Video's own query is left alone: refetching it would flash "not
  // found" on the page the User is leaving.
  const deleteMutation = useMutation(
    trpc.authenticated.projects.video.delete.mutationOptions({
      onSuccess: () => toast.success("Video deleted"),
      onError: (error) => toast.error(error.message),
      onSettled: () =>
        Promise.all([
          queryClient.invalidateQueries(
            trpc.authenticated.projects.video.list.queryFilter({ projectId }),
          ),
          queryClient.invalidateQueries(
            trpc.authenticated.projects.video.getUsage.queryFilter({
              projectId,
            }),
          ),
          // Its Feedback leaves the Task board and its source filter.
          queryClient.invalidateQueries({
            queryKey: trpc.authenticated.projects.feedback.pathKey(),
          }),
        ]),
    }),
  );

  return {
    renameMutation,
    replaceShareLinkMutation,
    setAnnotationsOpenMutation,
    deleteMutation,
  };
}
