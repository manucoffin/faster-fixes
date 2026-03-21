import { createProject } from "@/app/(authenticated)/_features/sidebar/project/create/create-project.trpc.mutation";
import { router } from "@/server/trpc/trpc";
import { bulkHardDeleteFeedback } from "../inbox/_features/archive/bulk-hard-delete-feedback.trpc.mutation";
import { getArchivedFeedback } from "../inbox/_features/archive/get-archived-feedback.trpc.query";
import { hardDeleteFeedback } from "../inbox/_features/archive/hard-delete-feedback.trpc.mutation";
import { bulkUpdateFeedbackStatus } from "../inbox/_features/bulk-update-feedback-status.trpc.mutation";
import { getFeedback } from "../inbox/_features/get-feedback.trpc.query";
import { getDistinctPageUrls } from "../inbox/_features/get-distinct-page-urls.trpc.query";
import { updateFeedbackAssignee } from "../inbox/_features/update-feedback-assignee.trpc.mutation";
import { updateFeedbackStatus } from "../inbox/_features/update-feedback-status.trpc.mutation";
import { createReviewer } from "../reviewers/_features/create/create-reviewer.trpc.mutation";
import { deleteReviewer } from "../reviewers/_features/delete/delete-reviewer.trpc.mutation";
import { getReviewers } from "../reviewers/_features/get-reviewers.trpc.query";
import { restoreReviewer } from "../reviewers/_features/restore/restore-reviewer.trpc.mutation";
import { revokeReviewer } from "../reviewers/_features/revoke/revoke-reviewer.trpc.mutation";
import { deleteProject } from "../settings/_features/delete/delete-project.trpc.mutation";
import { getProject } from "../settings/_features/get-project.trpc.query";
import { regenerateApiKey } from "../settings/_features/regenerate-api-key/regenerate-api-key.trpc.mutation";
import { updateProject } from "../settings/_features/update/update-project.trpc.mutation";
import { getProjects } from "./get-projects.trpc.query";

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
