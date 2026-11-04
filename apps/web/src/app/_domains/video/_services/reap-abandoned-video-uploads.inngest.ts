import { inngest } from "@/server/inngest";

import { deleteAbandonedVideoUploads } from "./delete-abandoned-video-uploads";

/**
 * Frees the budget an interrupted upload reserved: a closed tab never calls
 * the commit, so the `uploading` row would otherwise count forever.
 */
export const reapAbandonedVideoUploads = inngest.createFunction(
  {
    id: "reap-abandoned-video-uploads",
    retries: 1,
    triggers: [{ cron: "TZ=UTC 0 * * * *" }],
  },
  async ({ step }) =>
    step.run("delete-abandoned-uploads", () =>
      deleteAbandonedVideoUploads(new Date()),
    ),
);
