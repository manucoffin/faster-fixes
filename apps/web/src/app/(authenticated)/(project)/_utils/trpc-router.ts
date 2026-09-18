import { createIssueForFeedback } from "@/app/(authenticated)/(project)/inbox/_features/feedback-panel/create-issue-for-feedback.trpc.mutation";
import { createJiraIssueForFeedback } from "@/app/(authenticated)/(project)/inbox/_features/feedback-panel/create-jira-issue-for-feedback.trpc.mutation";
import { createLinearIssueForFeedback } from "@/app/(authenticated)/(project)/inbox/_features/feedback-panel/create-linear-issue-for-feedback.trpc.mutation";
import { updateFeedbackAssignee } from "@/app/(authenticated)/(project)/inbox/_features/feedback-panel/update-feedback-assignee.trpc.mutation";
import { updateFeedbackStatus } from "@/app/(authenticated)/(project)/inbox/_features/feedback-panel/update-feedback-status.trpc.mutation";
import { router } from "@/server/trpc/trpc";
import { bulkUpdateFeedbackStatus } from "../inbox/_features/actions-toolbar/bulk-update-feedback-status.trpc.mutation";
import { bulkHardDeleteFeedback } from "../inbox/_features/archive/bulk-hard-delete-feedback.trpc.mutation";
import { getArchivedFeedback } from "../inbox/_features/archive/get-archived-feedback.trpc.query";
import { hardDeleteFeedback } from "../inbox/_features/archive/hard-delete-feedback.trpc.mutation";
import { getDistinctPageUrls } from "../inbox/_features/filters/get-distinct-page-urls.trpc.query";
import { getFeedbackDiagnostics } from "../inbox/_features/feedback-panel/get-feedback-diagnostics.trpc.query";
import { getFeedback } from "../inbox/_features/get-feedback.trpc.query";
import { createReviewer } from "../reviewers/_features/create/create-reviewer.trpc.mutation";
import { deleteReviewer } from "../reviewers/_features/delete/delete-reviewer.trpc.mutation";
import { getReviewers } from "../reviewers/_features/get-reviewers.trpc.query";
import { restoreReviewer } from "../reviewers/_features/restore/restore-reviewer.trpc.mutation";
import { revokeReviewer } from "../reviewers/_features/revoke/revoke-reviewer.trpc.mutation";
import { deleteProject } from "../settings/_features/delete/delete-project.trpc.mutation";
import { getProject } from "../settings/_features/get-project.trpc.query";
import { getProjectGitHubLink } from "../settings/_features/github/get-project-link.trpc.query";
import { linkRepo } from "../settings/_features/github/link-repo/link-repo.trpc.mutation";
import { listAccessibleRepos } from "../settings/_features/github/link-repo/list-accessible-repos.trpc.query";
import { unlinkRepo } from "../settings/_features/github/unlink-repo/unlink-repo.trpc.mutation";
import { updateProjectLink } from "../settings/_features/github/update-link/update-project-link.trpc.mutation";
import { getProjectJiraLink } from "../settings/_features/jira/get-project-jira-link.trpc.query";
import { linkJiraProject } from "../settings/_features/jira/link-project/link-jira-project.trpc.mutation";
import { listJiraIssueTypesForProject } from "../settings/_features/jira/link-project/list-jira-issue-types.trpc.query";
import { listAccessibleJiraProjects } from "../settings/_features/jira/link-project/list-jira-projects.trpc.query";
import { unlinkJiraProject } from "../settings/_features/jira/unlink-project/unlink-jira-project.trpc.mutation";
import { updateProjectJiraLink } from "../settings/_features/jira/update-link/update-project-jira-link.trpc.mutation";
import { getProjectLinearLink } from "../settings/_features/linear/get-project-linear-link.trpc.query";
import { linkLinearTeam } from "../settings/_features/linear/link-team/link-team.trpc.mutation";
import { listAccessibleLinearTeams } from "../settings/_features/linear/link-team/list-accessible-teams.trpc.query";
import { listLinearTeamLabels } from "../settings/_features/linear/link-team/list-team-labels.trpc.query";
import { listLinearTeamStates } from "../settings/_features/linear/link-team/list-team-states.trpc.query";
import { unlinkLinearTeam } from "../settings/_features/linear/unlink-team/unlink-team.trpc.mutation";
import { updateProjectLinearLink } from "../settings/_features/linear/update-link/update-project-linear-link.trpc.mutation";
import { getProjectSlackLink } from "../settings/_features/slack/get-project-slack-link.trpc.query";
import { listSlackChannels } from "../settings/_features/slack/link-channel/list-slack-channels.trpc.query";
import { setProjectSlackChannel } from "../settings/_features/slack/link-channel/set-project-slack-channel.trpc.mutation";
import { updateProjectSlackLink } from "../settings/_features/slack/update-link/update-project-slack-link.trpc.mutation";
import { regenerateApiKey } from "../settings/_features/regenerate-api-key/regenerate-api-key.trpc.mutation";
import { updateProject } from "../settings/_features/update/update-project.trpc.mutation";
import { getProjects } from "./get-projects.trpc.query";

export const projectsRouter = router({
  list: getProjects,
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
    getDiagnostics: getFeedbackDiagnostics,
    updateStatus: updateFeedbackStatus,
    updateAssignee: updateFeedbackAssignee,
    bulkUpdateStatus: bulkUpdateFeedbackStatus,
    hardDelete: hardDeleteFeedback,
    bulkHardDelete: bulkHardDeleteFeedback,
    createIssue: createIssueForFeedback,
    createLinearIssue: createLinearIssueForFeedback,
    createJiraIssue: createJiraIssueForFeedback,
  }),
  github: router({
    getLink: getProjectGitHubLink,
    listRepos: listAccessibleRepos,
    linkRepo,
    unlinkRepo,
    updateLink: updateProjectLink,
  }),
  linear: router({
    getLink: getProjectLinearLink,
    listTeams: listAccessibleLinearTeams,
    listTeamStates: listLinearTeamStates,
    listTeamLabels: listLinearTeamLabels,
    linkTeam: linkLinearTeam,
    unlinkTeam: unlinkLinearTeam,
    updateLink: updateProjectLinearLink,
  }),
  jira: router({
    getLink: getProjectJiraLink,
    listProjects: listAccessibleJiraProjects,
    listIssueTypes: listJiraIssueTypesForProject,
    linkProject: linkJiraProject,
    unlinkProject: unlinkJiraProject,
    updateLink: updateProjectJiraLink,
  }),
  slack: router({
    getLink: getProjectSlackLink,
    listChannels: listSlackChannels,
    setProjectChannel: setProjectSlackChannel,
    updateLink: updateProjectSlackLink,
  }),
});
