import { router } from "@/server/trpc/trpc";
import { getProjects } from "../_features/list/get-projects.trpc.query";
import { createProject } from "../_features/create/create-project.trpc.mutation";
import { getProject } from "../_features/settings/get-project.trpc.query";
import { updateProject } from "../_features/settings/update-project.trpc.mutation";
import { deleteProject } from "../_features/settings/delete-project.trpc.mutation";
import { regenerateApiKey } from "../_features/settings/regenerate-api-key.trpc.mutation";
import { getReviewers } from "../_features/reviewers/get-reviewers.trpc.query";
import { createReviewer } from "../_features/reviewers/create-reviewer.trpc.mutation";
import { revokeReviewer } from "../_features/reviewers/revoke-reviewer.trpc.mutation";

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
  }),
});
