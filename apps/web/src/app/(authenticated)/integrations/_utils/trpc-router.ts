import { router } from "@/server/trpc/trpc";
import { createAgentToken } from "../_features/agent-tokens/create-agent-token.trpc.mutation";
import { deleteAgentToken } from "../_features/agent-tokens/delete-agent-token.trpc.mutation";
import { getAgentTokens } from "../_features/agent-tokens/get-agent-tokens.trpc.query";
import { revokeAgentToken } from "../_features/agent-tokens/revoke-agent-token.trpc.mutation";
import { disconnectGitHub } from "../_features/github/disconnect-github.trpc.mutation";
import { getGitHubInstallation } from "../_features/github/get-github-installation.trpc.query";

export const integrationsRouter = router({
  agentToken: router({
    list: getAgentTokens,
    create: createAgentToken,
    revoke: revokeAgentToken,
    delete: deleteAgentToken,
  }),
  github: router({
    getInstallation: getGitHubInstallation,
    disconnect: disconnectGitHub,
  }),
});
