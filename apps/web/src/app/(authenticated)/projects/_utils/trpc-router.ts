import { router } from "@/server/trpc/trpc";
import { createReviewer } from "../[projectId]/_features/reviewers/create/create-reviewer.trpc.mutation";
import { deleteReviewer } from "../[projectId]/_features/reviewers/delete/delete-reviewer.trpc.mutation";
import { getReviewers } from "../[projectId]/_features/reviewers/get-reviewers.trpc.query";
import { restoreReviewer } from "../[projectId]/_features/reviewers/restore/restore-reviewer.trpc.mutation";
import { revokeReviewer } from "../[projectId]/_features/reviewers/revoke/revoke-reviewer.trpc.mutation";
import { createProject } from "../_features/create/create-project.trpc.mutation";
import { getProjects } from "../_features/list/get-projects.trpc.query";
import { deleteProject } from "../_features/settings/delete-project.trpc.mutation";
import { getProject } from "../_features/settings/get-project.trpc.query";
import { regenerateApiKey } from "../_features/settings/regenerate-api-key.trpc.mutation";
import { updateProject } from "../_features/settings/update-project.trpc.mutation";

export const projetsRouter = router({
  list: getProjects,
  create: createProject,
  get: getProject,
  update: updateProject,
  delete: deleteProject,
  regenerateApiKey,
  reviewer: router({
    list: getReviewers,
    create: createReviewer,
    revoke: revokeReviewer,
    restore: restoreReviewer,
    delete: deleteReviewer,
  }),
});
