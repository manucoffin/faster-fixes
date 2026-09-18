import { protectedProcedure, router } from "@/server/trpc/trpc";
import { headers } from "next/headers";
import { createAgentToken } from "./_services/create-agent-token";
import { CreateAgentTokenSchema } from "./_services/create-agent-token.schema";
import { deleteAgentToken } from "./_services/delete-agent-token";
import { DeleteAgentTokenSchema } from "./_services/delete-agent-token.schema";
import { disconnectGitHub } from "./_services/disconnect-github";
import { disconnectJira } from "./_services/disconnect-jira";
import { disconnectLinear } from "./_services/disconnect-linear";
import { disconnectSlack } from "./_services/disconnect-slack";
import { getGitHubInstallation } from "./_services/get-github-installation";
import { getJiraInstallation } from "./_services/get-jira-installation";
import { getLinearInstallation } from "./_services/get-linear-installation";
import { getSlackInstallation } from "./_services/get-slack-installation";
import { listAccessibleJiraSites } from "./_services/list-accessible-jira-sites";
import { listAgentTokens } from "./_services/list-agent-tokens";
import { ListAgentTokensSchema } from "./_services/list-agent-tokens.schema";
import { revokeAgentToken } from "./_services/revoke-agent-token";
import { RevokeAgentTokenSchema } from "./_services/revoke-agent-token.schema";
import { selectJiraSite } from "./_services/select-jira-site";
import { SelectJiraSiteSchema } from "./_services/select-jira-site.schema";

// Every denial of this scope reads a loaded row (a membership, or the Jira site
// list), so all of them live in their service; `protectedProcedure` answers
// identity alone. The installation services resolve the active Organization
// themselves from the request headers the procedure hands them.
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
    getInstallation: protectedProcedure.query(async ({ ctx }) =>
      getGitHubInstallation({
        headers: await headers(),
        userId: ctx.session.user.id,
      }),
    ),
    disconnect: protectedProcedure.mutation(async ({ ctx }) =>
      disconnectGitHub({
        headers: await headers(),
        userId: ctx.session.user.id,
      }),
    ),
  }),
  linear: router({
    getInstallation: protectedProcedure.query(async ({ ctx }) =>
      getLinearInstallation({
        headers: await headers(),
        userId: ctx.session.user.id,
      }),
    ),
    disconnect: protectedProcedure.mutation(async ({ ctx }) =>
      disconnectLinear({
        headers: await headers(),
        userId: ctx.session.user.id,
      }),
    ),
  }),
  jira: router({
    getInstallation: protectedProcedure.query(async ({ ctx }) =>
      getJiraInstallation({
        headers: await headers(),
        userId: ctx.session.user.id,
      }),
    ),
    listAccessibleSites: protectedProcedure.query(async ({ ctx }) =>
      listAccessibleJiraSites({
        headers: await headers(),
        userId: ctx.session.user.id,
      }),
    ),
    selectSite: protectedProcedure
      .input(SelectJiraSiteSchema)
      .mutation(async ({ input, ctx }) =>
        selectJiraSite({
          cloudId: input.cloudId,
          headers: await headers(),
          userId: ctx.session.user.id,
        }),
      ),
    disconnect: protectedProcedure.mutation(async ({ ctx }) =>
      disconnectJira({
        headers: await headers(),
        userId: ctx.session.user.id,
      }),
    ),
  }),
  slack: router({
    getInstallation: protectedProcedure.query(async ({ ctx }) =>
      getSlackInstallation({
        headers: await headers(),
        userId: ctx.session.user.id,
      }),
    ),
    disconnect: protectedProcedure.mutation(async ({ ctx }) =>
      disconnectSlack({
        headers: await headers(),
        userId: ctx.session.user.id,
      }),
    ),
  }),
});
