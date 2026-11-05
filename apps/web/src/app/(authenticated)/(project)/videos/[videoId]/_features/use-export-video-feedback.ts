import { useTRPC } from "@/lib/trpc/trpc-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { getVideoFeedbackExportFileName } from "../_helpers/get-video-feedback-export-file-name";

type UseExportVideoFeedbackOptions = {
  videoId: string;
  title: string;
};

export function useExportVideoFeedback({
  videoId,
  title,
}: UseExportVideoFeedbackOptions) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      // Fetched fresh on every click: the Screenshot URLs are signed for an hour.
      queryClient.fetchQuery({
        ...trpc.authenticated.projects.video.exportFeedback.queryOptions({
          videoId,
        }),
        staleTime: 0,
      }),
    onSuccess: (document) => {
      const blob = new Blob([JSON.stringify(document, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = Object.assign(window.document.createElement("a"), {
        href: url,
        download: getVideoFeedbackExportFileName(title, videoId),
      });
      link.click();
      URL.revokeObjectURL(url);
    },
    onError: (error) => toast.error(error.message),
  });
}
