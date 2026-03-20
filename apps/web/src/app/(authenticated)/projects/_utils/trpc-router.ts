import { updateProject } from "@/app/(authenticated)/projects/[projectId]/_features/settings/update/update-project.trpc.mutation";
import { router } from "@/server/trpc/trpc";
import { bulkHardDeleteFeedback } from "../[projectId]/_features/archive/bulk-hard-delete-feedback.trpc.mutation";
import { getArchivedFeedback } from "../[projectId]/_features/archive/get-archived-feedback.trpc.query";
import { hardDeleteFeedback } from "../[projectId]/_features/archive/hard-delete-feedback.trpc.mutation";
import { bulkUpdateFeedbackStatus } from "../[projectId]/_features/inbox/bulk-update-feedback-status.trpc.mutation";
import { getFeedback } from "../[projectId]/_features/inbox/get-feedback.trpc.query";
import { getDistinctPageUrls } from "../[projectId]/_features/inbox/get-distinct-page-urls.trpc.query";
import { updateFeedbackAssignee } from "../[projectId]/_features/inbox/update-feedback-assignee.trpc.mutation";
import { updateFeedbackStatus } from "../[projectId]/_features/inbox/update-feedback-status.trpc.mutation";
import { createReviewer } from "../[projectId]/_features/reviewers/create/create-reviewer.trpc.mutation";
import { deleteReviewer } from "../[projectId]/_features/reviewers/delete/delete-reviewer.trpc.mutation";
import { getReviewers } from "../[projectId]/_features/reviewers/get-reviewers.trpc.query";
import { restoreReviewer } from "../[projectId]/_features/reviewers/restore/restore-reviewer.trpc.mutation";
import { revokeReviewer } from "../[projectId]/_features/reviewers/revoke/revoke-reviewer.trpc.mutation";
import { deleteProject } from "../[projectId]/_features/settings/delete/delete-project.trpc.mutation";
import { getProject } from "../[projectId]/_features/settings/get-project.trpc.query";
import { regenerateApiKey } from "../[projectId]/_features/settings/regenerate-api-key/regenerate-api-key.trpc.mutation";
import { createProject } from "../_features/create/create-project.trpc.mutation";
import { getProjects } from "../_features/list/get-projects.trpc.query";

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
  feedback: router({
    list: getFeedback,
    listArchived: getArchivedFeedback,
    distinctPageUrls: getDistinctPageUrls,
    updateStatus: updateFeedbackStatus,
    updateAssignee: updateFeedbackAssignee,
    bulkUpdateStatus: bulkUpdateFeedbackStatus,
    hardDelete: hardDeleteFeedback,
    bulkHardDelete: bulkHardDeleteFeedback,
  }),
});
