import { enforceFeature } from "@/server/trpc/middlewares/enforce-feature";
import { protectedProcedure, router } from "@/server/trpc/trpc";
import { headers } from "next/headers";
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
import { getProjectGitHubLink } from "./settings/_services/get-project-github-link";
import { GetProjectGitHubLinkSchema } from "./settings/_services/get-project-github-link.schema";
import { getProjectJiraLink } from "./settings/_services/get-project-jira-link";
import { GetProjectJiraLinkSchema } from "./settings/_services/get-project-jira-link.schema";
import { linkJiraProject } from "./settings/_services/link-jira-project";
import { LinkJiraProjectSchema } from "./settings/_services/link-jira-project.schema";
import { listAccessibleJiraProjects } from "./settings/_services/list-accessible-jira-projects";
import { ListAccessibleJiraProjectsSchema } from "./settings/_services/list-accessible-jira-projects.schema";
import { listJiraIssueTypesForProject } from "./settings/_services/list-jira-issue-types-for-project";
import { ListJiraIssueTypesForProjectSchema } from "./settings/_services/list-jira-issue-types-for-project.schema";
import { unlinkJiraProject } from "./settings/_services/unlink-jira-project";
import { UnlinkJiraProjectSchema } from "./settings/_services/unlink-jira-project.schema";
import { updateProjectJiraLink } from "./settings/_services/update-project-jira-link";
import { UpdateProjectJiraLinkSchema } from "./settings/_services/update-project-jira-link.schema";
import { getProjectLinearLink } from "./settings/_services/get-project-linear-link";
import { GetProjectLinearLinkSchema } from "./settings/_services/get-project-linear-link.schema";
import { linkLinearTeam } from "./settings/_services/link-linear-team";
import { LinkLinearTeamSchema } from "./settings/_services/link-linear-team.schema";
import { listAccessibleLinearTeams } from "./settings/_services/list-accessible-linear-teams";
import { listLinearTeamLabels } from "./settings/_services/list-linear-team-labels";
import { ListLinearTeamLabelsSchema } from "./settings/_services/list-linear-team-labels.schema";
import { listLinearTeamStates } from "./settings/_services/list-linear-team-states";
import { ListLinearTeamStatesSchema } from "./settings/_services/list-linear-team-states.schema";
import { unlinkLinearTeam } from "./settings/_services/unlink-linear-team";
import { UnlinkLinearTeamSchema } from "./settings/_services/unlink-linear-team.schema";
import { updateProjectLinearLink } from "./settings/_services/update-project-linear-link";
import { UpdateProjectLinearLinkSchema } from "./settings/_services/update-project-linear-link.schema";
import { getProjectSlackLink } from "./settings/_services/get-project-slack-link";
import { GetProjectSlackLinkSchema } from "./settings/_services/get-project-slack-link.schema";
import { linkRepo } from "./settings/_services/link-repo";
import { LinkRepoSchema } from "./settings/_services/link-repo.schema";
import { linkSlackChannel } from "./settings/_services/link-slack-channel";
import { LinkSlackChannelSchema } from "./settings/_services/link-slack-channel.schema";
import { listAccessibleRepos } from "./settings/_services/list-accessible-repos";
import { listSlackChannels } from "./settings/_services/list-slack-channels";
import { unlinkRepo } from "./settings/_services/unlink-repo";
import { UnlinkRepoSchema } from "./settings/_services/unlink-repo.schema";
import { updateProjectGitHubLink } from "./settings/_services/update-project-github-link";
import { UpdateProjectGitHubLinkSchema } from "./settings/_services/update-project-github-link.schema";
import { updateProjectSlackLink } from "./settings/_services/update-project-slack-link";
import { UpdateProjectSlackLinkSchema } from "./settings/_services/update-project-slack-link.schema";
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
// `protectedProcedure` answers identity alone.
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
  // The plan-gated writes keep `enforceFeature`: a plan denial is transport
  // policy and has no domain-error equivalent.
  github: router({
    getLink: protectedProcedure
      .input(GetProjectGitHubLinkSchema)
      .query(({ input, ctx }) =>
        getProjectGitHubLink({
          projectId: input.projectId,
          userId: ctx.session.user.id,
        }),
      ),
    listRepos: protectedProcedure.query(async ({ ctx }) =>
      listAccessibleRepos({
        userId: ctx.session.user.id,
        headers: await headers(),
      }),
    ),
    linkRepo: protectedProcedure
      .input(LinkRepoSchema)
      .use(enforceFeature("githubIntegration"))
      .mutation(({ input, ctx }) =>
        linkRepo({ ...input, userId: ctx.session.user.id }),
      ),
    // Not plan-gated: a downgraded Organization must always be able to unlink.
    unlinkRepo: protectedProcedure
      .input(UnlinkRepoSchema)
      .mutation(({ input, ctx }) =>
        unlinkRepo({
          projectId: input.projectId,
          userId: ctx.session.user.id,
        }),
      ),
    updateLink: protectedProcedure
      .input(UpdateProjectGitHubLinkSchema)
      .use(enforceFeature("githubIntegration"))
      .mutation(({ input, ctx }) =>
        updateProjectGitHubLink({
          projectId: input.projectId,
          autoCreateIssues: input.autoCreateIssues,
          defaultLabels: input.defaultLabels,
          userId: ctx.session.user.id,
        }),
      ),
  }),
  linear: router({
    getLink: protectedProcedure
      .input(GetProjectLinearLinkSchema)
      .query(({ input, ctx }) =>
        getProjectLinearLink({
          projectId: input.projectId,
          userId: ctx.session.user.id,
        }),
      ),
    listTeams: protectedProcedure.query(async ({ ctx }) =>
      listAccessibleLinearTeams({
        userId: ctx.session.user.id,
        headers: await headers(),
      }),
    ),
    listTeamStates: protectedProcedure
      .input(ListLinearTeamStatesSchema)
      .query(({ input, ctx }) =>
        listLinearTeamStates({
          teamId: input.teamId,
          userId: ctx.session.user.id,
        }),
      ),
    listTeamLabels: protectedProcedure
      .input(ListLinearTeamLabelsSchema)
      .query(({ input, ctx }) =>
        listLinearTeamLabels({
          teamId: input.teamId,
          userId: ctx.session.user.id,
        }),
      ),
    linkTeam: protectedProcedure
      .input(LinkLinearTeamSchema)
      .use(enforceFeature("linearIntegration"))
      .mutation(({ input, ctx }) =>
        linkLinearTeam({ ...input, userId: ctx.session.user.id }),
      ),
    // Not plan-gated: a downgraded Organization must always be able to unlink.
    unlinkTeam: protectedProcedure
      .input(UnlinkLinearTeamSchema)
      .mutation(({ input, ctx }) =>
        unlinkLinearTeam({
          projectId: input.projectId,
          userId: ctx.session.user.id,
        }),
      ),
    updateLink: protectedProcedure
      .input(UpdateProjectLinearLinkSchema)
      .use(enforceFeature("linearIntegration"))
      .mutation(({ input, ctx }) =>
        updateProjectLinearLink({ ...input, userId: ctx.session.user.id }),
      ),
  }),
  jira: router({
    getLink: protectedProcedure
      .input(GetProjectJiraLinkSchema)
      .query(({ input, ctx }) =>
        getProjectJiraLink({
          projectId: input.projectId,
          userId: ctx.session.user.id,
        }),
      ),
    listProjects: protectedProcedure
      .input(ListAccessibleJiraProjectsSchema)
      .query(({ input, ctx }) =>
        listAccessibleJiraProjects({
          projectId: input.projectId,
          userId: ctx.session.user.id,
        }),
      ),
    listIssueTypes: protectedProcedure
      .input(ListJiraIssueTypesForProjectSchema)
      .query(({ input, ctx }) =>
        listJiraIssueTypesForProject({
          projectId: input.projectId,
          jiraProjectId: input.jiraProjectId,
          userId: ctx.session.user.id,
        }),
      ),
    linkProject: protectedProcedure
      .input(LinkJiraProjectSchema)
      .use(enforceFeature("jiraIntegration"))
      .mutation(({ input, ctx }) =>
        linkJiraProject({ ...input, userId: ctx.session.user.id }),
      ),
    // Not plan-gated: a downgraded Organization must always be able to unlink.
    unlinkProject: protectedProcedure
      .input(UnlinkJiraProjectSchema)
      .mutation(({ input, ctx }) =>
        unlinkJiraProject({
          projectId: input.projectId,
          userId: ctx.session.user.id,
        }),
      ),
    updateLink: protectedProcedure
      .input(UpdateProjectJiraLinkSchema)
      .use(enforceFeature("jiraIntegration"))
      .mutation(({ input, ctx }) =>
        updateProjectJiraLink({
          projectId: input.projectId,
          autoCreateIssues: input.autoCreateIssues,
          defaultLabels: input.defaultLabels,
          userId: ctx.session.user.id,
        }),
      ),
  }),
  slack: router({
    getLink: protectedProcedure
      .input(GetProjectSlackLinkSchema)
      .query(({ input, ctx }) =>
        getProjectSlackLink({
          projectId: input.projectId,
          userId: ctx.session.user.id,
        }),
      ),
    listChannels: protectedProcedure.query(async ({ ctx }) =>
      listSlackChannels({
        userId: ctx.session.user.id,
        headers: await headers(),
      }),
    ),
    linkChannel: protectedProcedure
      .input(LinkSlackChannelSchema)
      .use(enforceFeature("slackIntegration"))
      .mutation(({ input, ctx }) =>
        linkSlackChannel({
          projectId: input.projectId,
          channelId: input.channelId,
          channelName: input.channelName,
          userId: ctx.session.user.id,
        }),
      ),
    updateLink: protectedProcedure
      .input(UpdateProjectSlackLinkSchema)
      .use(enforceFeature("slackIntegration"))
      .mutation(({ input, ctx }) =>
        updateProjectSlackLink({
          projectId: input.projectId,
          enabled: input.enabled,
          userId: ctx.session.user.id,
        }),
      ),
  }),
});
