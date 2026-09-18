import { protectedProcedure, router } from "@/server/trpc/trpc";
import { disconnectGitHub } from "./_features/github/disconnect-github.trpc.mutation";
import { getGitHubInstallation } from "./_features/github/get-github-installation.trpc.query";
import { disconnectJira } from "./_features/jira/disconnect-jira.trpc.mutation";
import { getJiraInstallation } from "./_features/jira/get-jira-installation.trpc.query";
import { listAccessibleJiraSites } from "./_features/jira/list-accessible-sites.trpc.query";
import { selectJiraSite } from "./_features/jira/select-jira-site.trpc.mutation";
import { disconnectLinear } from "./_features/linear/disconnect-linear.trpc.mutation";
import { getLinearInstallation } from "./_features/linear/get-linear-installation.trpc.query";
import { disconnectSlack } from "./_features/slack/disconnect-slack.trpc.mutation";
import { getSlackInstallation } from "./_features/slack/get-slack-installation.trpc.query";
import { createAgentToken } from "./_services/create-agent-token";
import { CreateAgentTokenSchema } from "./_services/create-agent-token.schema";
import { deleteAgentToken } from "./_services/delete-agent-token";
import { DeleteAgentTokenSchema } from "./_services/delete-agent-token.schema";
import { listAgentTokens } from "./_services/list-agent-tokens";
import { ListAgentTokensSchema } from "./_services/list-agent-tokens.schema";
import { revokeAgentToken } from "./_services/revoke-agent-token";
import { RevokeAgentTokenSchema } from "./_services/revoke-agent-token.schema";

// Every denial of the agent token operations reads a loaded membership, so all
// of them live in their service; `protectedProcedure` answers identity alone.
// The five installation sub-routers still mount pre-migration procedure
// modules: issue #73 extracts them and locks the scope.
export const integrationsRouter = router({
  agentToken: router({
    list: protectedProcedure
      .input(ListAgentTokensSchema)
      .query(({ input, ctx }) =>
        listAgentTokens({
          organizationId: input.organizationId,
          userId: ctx.session.user.id,
        }),
      ),
    create: protectedProcedure
      .input(CreateAgentTokenSchema)
      .mutation(({ input, ctx }) =>
        createAgentToken({
          organizationId: input.organizationId,
          name: input.name,
          scopes: input.scopes,
          userId: ctx.session.user.id,
        }),
      ),
    revoke: protectedProcedure
      .input(RevokeAgentTokenSchema)
      .mutation(({ input, ctx }) =>
        revokeAgentToken({
          organizationId: input.organizationId,
          tokenId: input.tokenId,
          userId: ctx.session.user.id,
        }),
      ),
    delete: protectedProcedure
      .input(DeleteAgentTokenSchema)
      .mutation(({ input, ctx }) =>
        deleteAgentToken({
          organizationId: input.organizationId,
          tokenId: input.tokenId,
          userId: ctx.session.user.id,
        }),
      ),
  }),
  github: router({
    getInstallation: getGitHubInstallation,
    disconnect: disconnectGitHub,
  }),
  linear: router({
    getInstallation: getLinearInstallation,
    disconnect: disconnectLinear,
  }),
  jira: router({
    getInstallation: getJiraInstallation,
    listAccessibleSites: listAccessibleJiraSites,
    selectSite: selectJiraSite,
    disconnect: disconnectJira,
  }),
  slack: router({
    getInstallation: getSlackInstallation,
    disconnect: disconnectSlack,
  }),
});
