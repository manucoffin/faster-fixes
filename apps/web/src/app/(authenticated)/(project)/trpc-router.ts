import { createIssueForFeedback } from "@/app/(authenticated)/(project)/inbox/_features/feedback-panel/create-issue-for-feedback.trpc.mutation";
import { createJiraIssueForFeedback } from "@/app/(authenticated)/(project)/inbox/_features/feedback-panel/create-jira-issue-for-feedback.trpc.mutation";
import { createLinearIssueForFeedback } from "@/app/(authenticated)/(project)/inbox/_features/feedback-panel/create-linear-issue-for-feedback.trpc.mutation";
import { updateFeedbackAssignee } from "@/app/(authenticated)/(project)/inbox/_features/feedback-panel/update-feedback-assignee.trpc.mutation";
import { updateFeedbackStatus } from "@/app/(authenticated)/(project)/inbox/_features/feedback-panel/update-feedback-status.trpc.mutation";
import { protectedProcedure, router } from "@/server/trpc/trpc";
import { getFeedbackDiagnostics } from "./inbox/_features/feedback-panel/get-feedback-diagnostics.trpc.query";
import { createReviewer } from "./reviewers/_features/create/create-reviewer.trpc.mutation";
import { deleteReviewer } from "./reviewers/_features/delete/delete-reviewer.trpc.mutation";
import { getReviewers } from "./reviewers/_features/get-reviewers.trpc.query";
import { restoreReviewer } from "./reviewers/_features/restore/restore-reviewer.trpc.mutation";
import { revokeReviewer } from "./reviewers/_features/revoke/revoke-reviewer.trpc.mutation";
import { deleteProject } from "./settings/_features/delete/delete-project.trpc.mutation";
import { getProject } from "./settings/_features/get-project.trpc.query";
import { getProjectGitHubLink } from "./settings/_features/github/get-project-link.trpc.query";
import { linkRepo } from "./settings/_features/github/link-repo/link-repo.trpc.mutation";
import { listAccessibleRepos } from "./settings/_features/github/link-repo/list-accessible-repos.trpc.query";
import { unlinkRepo } from "./settings/_features/github/unlink-repo/unlink-repo.trpc.mutation";
import { updateProjectLink } from "./settings/_features/github/update-link/update-project-link.trpc.mutation";
import { getProjectJiraLink } from "./settings/_features/jira/get-project-jira-link.trpc.query";
import { linkJiraProject } from "./settings/_features/jira/link-project/link-jira-project.trpc.mutation";
import { listJiraIssueTypesForProject } from "./settings/_features/jira/link-project/list-jira-issue-types.trpc.query";
import { listAccessibleJiraProjects } from "./settings/_features/jira/link-project/list-jira-projects.trpc.query";
import { unlinkJiraProject } from "./settings/_features/jira/unlink-project/unlink-jira-project.trpc.mutation";
import { updateProjectJiraLink } from "./settings/_features/jira/update-link/update-project-jira-link.trpc.mutation";
import { getProjectLinearLink } from "./settings/_features/linear/get-project-linear-link.trpc.query";
import { linkLinearTeam } from "./settings/_features/linear/link-team/link-team.trpc.mutation";
import { listAccessibleLinearTeams } from "./settings/_features/linear/link-team/list-accessible-teams.trpc.query";
import { listLinearTeamLabels } from "./settings/_features/linear/link-team/list-team-labels.trpc.query";
import { listLinearTeamStates } from "./settings/_features/linear/link-team/list-team-states.trpc.query";
import { unlinkLinearTeam } from "./settings/_features/linear/unlink-team/unlink-team.trpc.mutation";
import { updateProjectLinearLink } from "./settings/_features/linear/update-link/update-project-linear-link.trpc.mutation";
import { regenerateApiKey } from "./settings/_features/regenerate-api-key/regenerate-api-key.trpc.mutation";
import { getProjectSlackLink } from "./settings/_features/slack/get-project-slack-link.trpc.query";
import { listSlackChannels } from "./settings/_features/slack/link-channel/list-slack-channels.trpc.query";
import { setProjectSlackChannel } from "./settings/_features/slack/link-channel/set-project-slack-channel.trpc.mutation";
import { updateProjectSlackLink } from "./settings/_features/slack/update-link/update-project-slack-link.trpc.mutation";
import { updateProject } from "./settings/_features/update/update-project.trpc.mutation";
import { listProjects } from "./_services/list-projects";
import { ListProjectsSchema } from "./_services/list-projects.schema";
import { deleteFeedback } from "./inbox/_services/delete-feedback";
import { DeleteFeedbackSchema } from "./inbox/_services/delete-feedback.schema";
import { deleteFeedbacks } from "./inbox/_services/delete-feedbacks";
import { DeleteFeedbacksSchema } from "./inbox/_services/delete-feedbacks.schema";
import { listArchivedFeedback } from "./inbox/_services/list-archived-feedback";
import { ListArchivedFeedbackSchema } from "./inbox/_services/list-archived-feedback.schema";
import { listDistinctPageUrls } from "./inbox/_services/list-distinct-page-urls";
import { ListDistinctPageUrlsSchema } from "./inbox/_services/list-distinct-page-urls.schema";
import { listFeedback } from "./inbox/_services/list-feedback";
import { ListFeedbackSchema } from "./inbox/_services/list-feedback.schema";
import { updateFeedbacksStatus } from "./inbox/_services/update-feedbacks-status";
import { UpdateFeedbacksStatusSchema } from "./inbox/_services/update-feedbacks-status.schema";

// Every denial of the migrated operations reads a loaded row (the Project, or
// the Feedback and its Project), so all of them live in their service;
// `protectedProcedure` answers identity alone. The keys still bound to a
// procedure module belong to issues #75 to #79.
export const projectsRouter = router({
  list: protectedProcedure.input(ListProjectsSchema).query(({ input, ctx }) =>
    listProjects({
      organizationId: input.organizationId,
      userId: ctx.session.user.id,
    }),
  ),
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
    list: protectedProcedure.input(ListFeedbackSchema).query(({ input, ctx }) =>
      listFeedback({
        projectId: input.projectId,
        userId: ctx.session.user.id,
      }),
    ),
    listArchived: protectedProcedure
      .input(ListArchivedFeedbackSchema)
      .query(({ input, ctx }) =>
        listArchivedFeedback({
          projectId: input.projectId,
          page: input.page,
          pageSize: input.pageSize,
          search: input.search,
          sortBy: input.sortBy,
          sortOrder: input.sortOrder,
          userId: ctx.session.user.id,
        }),
      ),
    listDistinctPageUrls: protectedProcedure
      .input(ListDistinctPageUrlsSchema)
      .query(({ input, ctx }) =>
        listDistinctPageUrls({
          projectId: input.projectId,
          userId: ctx.session.user.id,
        }),
      ),
    getDiagnostics: getFeedbackDiagnostics,
    updateStatus: updateFeedbackStatus,
    updateAssignee: updateFeedbackAssignee,
    // The plural services drop the entity the router already carries, so the
    // key keeps only the `Many` that tells the two apart.
    updateManyStatus: protectedProcedure
      .input(UpdateFeedbacksStatusSchema)
      .mutation(({ input, ctx }) =>
        updateFeedbacksStatus({
          feedbackIds: input.feedbackIds,
          status: input.status,
          userId: ctx.session.user.id,
        }),
      ),
    delete: protectedProcedure
      .input(DeleteFeedbackSchema)
      .mutation(({ input, ctx }) =>
        deleteFeedback({
          feedbackId: input.feedbackId,
          userId: ctx.session.user.id,
        }),
      ),
    deleteMany: protectedProcedure
      .input(DeleteFeedbacksSchema)
      .mutation(({ input, ctx }) =>
        deleteFeedbacks({
          feedbackIds: input.feedbackIds,
          userId: ctx.session.user.id,
        }),
      ),
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
