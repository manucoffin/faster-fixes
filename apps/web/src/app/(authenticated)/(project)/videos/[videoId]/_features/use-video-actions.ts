import { useTRPC } from "@/lib/trpc/trpc-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type UseVideoActionsOptions = {
  videoId: string;
  projectId: string;
};

// The Video page header's writes. Each one refreshes the page and the Videos
// list, which shows the same title, link and annotations state.
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
      onSuccess: () => toast.success("Link replaced"),
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

  return {
    renameMutation,
    replaceShareLinkMutation,
    setAnnotationsOpenMutation,
  };
}
