import { protectedProcedure, router } from "@/server/trpc/trpc";
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
import { getProjectSlackLink } from "./settings/_features/slack/get-project-slack-link.trpc.query";
import { listSlackChannels } from "./settings/_features/slack/link-channel/list-slack-channels.trpc.query";
import { setProjectSlackChannel } from "./settings/_features/slack/link-channel/set-project-slack-channel.trpc.mutation";
import { updateProjectSlackLink } from "./settings/_features/slack/update-link/update-project-slack-link.trpc.mutation";
import { createReviewer } from "./reviewers/_services/create-reviewer";
import { CreateReviewerSchema } from "./reviewers/_services/create-reviewer.schema";
import { deleteReviewer } from "./reviewers/_services/delete-reviewer";
import { DeleteReviewerSchema } from "./reviewers/_services/delete-reviewer.schema";
import { listReviewers } from "./reviewers/_services/list-reviewers";
import { ListReviewersSchema } from "./reviewers/_services/list-reviewers.schema";
import { restoreReviewer } from "./reviewers/_services/restore-reviewer";
import { RestoreReviewerSchema } from "./reviewers/_services/restore-reviewer.schema";
import { revokeReviewer } from "./reviewers/_services/revoke-reviewer";
import { RevokeReviewerSchema } from "./reviewers/_services/revoke-reviewer.schema";
import { deleteProject } from "./settings/_services/delete-project";
import { DeleteProjectSchema } from "./settings/_services/delete-project.schema";
import { getProject } from "./settings/_services/get-project";
import { GetProjectSchema } from "./settings/_services/get-project.schema";
import { regenerateApiKey } from "./settings/_services/regenerate-api-key";
import { RegenerateApiKeySchema } from "./settings/_services/regenerate-api-key.schema";
import { updateProject } from "./settings/_services/update-project";
import { UpdateProjectSchema } from "./settings/_services/update-project.schema";
import { listProjects } from "./_services/list-projects";
import { ListProjectsSchema } from "./_services/list-projects.schema";
import { createGitHubIssueForFeedback } from "./inbox/_services/create-github-issue-for-feedback";
import { CreateGitHubIssueForFeedbackSchema } from "./inbox/_services/create-github-issue-for-feedback.schema";
import { createJiraIssueForFeedback } from "./inbox/_services/create-jira-issue-for-feedback";
import { CreateJiraIssueForFeedbackSchema } from "./inbox/_services/create-jira-issue-for-feedback.schema";
import { createLinearIssueForFeedback } from "./inbox/_services/create-linear-issue-for-feedback";
import { CreateLinearIssueForFeedbackSchema } from "./inbox/_services/create-linear-issue-for-feedback.schema";
import { deleteFeedback } from "./inbox/_services/delete-feedback";
import { DeleteFeedbackSchema } from "./inbox/_services/delete-feedback.schema";
import { deleteFeedbacks } from "./inbox/_services/delete-feedbacks";
import { DeleteFeedbacksSchema } from "./inbox/_services/delete-feedbacks.schema";
import { getFeedbackDiagnostics } from "./inbox/_services/get-feedback-diagnostics";
import { GetFeedbackDiagnosticsSchema } from "./inbox/_services/get-feedback-diagnostics.schema";
import { listArchivedFeedback } from "./inbox/_services/list-archived-feedback";
import { ListArchivedFeedbackSchema } from "./inbox/_services/list-archived-feedback.schema";
import { listDistinctPageUrls } from "./inbox/_services/list-distinct-page-urls";
import { ListDistinctPageUrlsSchema } from "./inbox/_services/list-distinct-page-urls.schema";
import { listFeedback } from "./inbox/_services/list-feedback";
import { ListFeedbackSchema } from "./inbox/_services/list-feedback.schema";
import { updateFeedbackAssignee } from "./inbox/_services/update-feedback-assignee";
import { UpdateFeedbackAssigneeSchema } from "./inbox/_services/update-feedback-assignee.schema";
import { updateFeedbackStatus } from "./inbox/_services/update-feedback-status";
import { UpdateFeedbackStatusSchema } from "./inbox/_services/update-feedback-status.schema";
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
  get: protectedProcedure.input(GetProjectSchema).query(({ input, ctx }) =>
    getProject({
      projectId: input.projectId,
      userId: ctx.session.user.id,
    }),
  ),
  update: protectedProcedure
    .input(UpdateProjectSchema)
    .mutation(({ input, ctx }) =>
      updateProject({
        projectId: input.projectId,
        name: input.name,
        domain: input.domain,
        widgetEnabled: input.widgetEnabled,
        userId: ctx.session.user.id,
      }),
    ),
  delete: protectedProcedure
    .input(DeleteProjectSchema)
    .mutation(({ input, ctx }) =>
      deleteProject({
        projectId: input.projectId,
        userId: ctx.session.user.id,
      }),
    ),
  // The key names the API key, not the Project the router already carries, so
  // it keeps the full service name.
  regenerateApiKey: protectedProcedure
    .input(RegenerateApiKeySchema)
    .mutation(({ input, ctx }) =>
      regenerateApiKey({
        projectId: input.projectId,
        userId: ctx.session.user.id,
      }),
    ),
  reviewer: router({
    list: protectedProcedure
      .input(ListReviewersSchema)
      .query(({ input, ctx }) =>
        listReviewers({
          projectId: input.projectId,
          userId: ctx.session.user.id,
        }),
      ),
    create: protectedProcedure
      .input(CreateReviewerSchema)
      .mutation(({ input, ctx }) =>
        createReviewer({
          projectId: input.projectId,
          name: input.name,
          userId: ctx.session.user.id,
        }),
      ),
    revoke: protectedProcedure
      .input(RevokeReviewerSchema)
      .mutation(({ input, ctx }) =>
        revokeReviewer({
          reviewerId: input.reviewerId,
          userId: ctx.session.user.id,
        }),
      ),
    restore: protectedProcedure
      .input(RestoreReviewerSchema)
      .mutation(({ input, ctx }) =>
        restoreReviewer({
          reviewerId: input.reviewerId,
          userId: ctx.session.user.id,
        }),
      ),
    delete: protectedProcedure
      .input(DeleteReviewerSchema)
      .mutation(({ input, ctx }) =>
        deleteReviewer({
          reviewerId: input.reviewerId,
          userId: ctx.session.user.id,
        }),
      ),
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
    getDiagnostics: protectedProcedure
      .input(GetFeedbackDiagnosticsSchema)
      .query(({ input, ctx }) =>
        getFeedbackDiagnostics({
          projectId: input.projectId,
          feedbackId: input.feedbackId,
          userId: ctx.session.user.id,
        }),
      ),
    updateStatus: protectedProcedure
      .input(UpdateFeedbackStatusSchema)
      .mutation(({ input, ctx }) =>
        updateFeedbackStatus({
          feedbackId: input.feedbackId,
          status: input.status,
          userId: ctx.session.user.id,
        }),
      ),
    updateAssignee: protectedProcedure
      .input(UpdateFeedbackAssigneeSchema)
      .mutation(({ input, ctx }) =>
        updateFeedbackAssignee({
          feedbackId: input.feedbackId,
          assigneeId: input.assigneeId,
          userId: ctx.session.user.id,
        }),
      ),
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
    // The three tracker keys are symmetric now that the GitHub one names its
    // tracker like its two siblings.
    createGitHubIssue: protectedProcedure
      .input(CreateGitHubIssueForFeedbackSchema)
      .mutation(({ input, ctx }) =>
        createGitHubIssueForFeedback({
          feedbackId: input.feedbackId,
          userId: ctx.session.user.id,
        }),
      ),
    createLinearIssue: protectedProcedure
      .input(CreateLinearIssueForFeedbackSchema)
      .mutation(({ input, ctx }) =>
        createLinearIssueForFeedback({
          feedbackId: input.feedbackId,
          userId: ctx.session.user.id,
        }),
      ),
    createJiraIssue: protectedProcedure
      .input(CreateJiraIssueForFeedbackSchema)
      .mutation(({ input, ctx }) =>
        createJiraIssueForFeedback({
          feedbackId: input.feedbackId,
          userId: ctx.session.user.id,
        }),
      ),
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
