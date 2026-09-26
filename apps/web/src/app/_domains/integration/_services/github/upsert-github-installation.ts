import { prisma } from "@workspace/db";

import type { GitHubInstallationAccount } from "./find-github-installation-account";

/**
 * Records the Installation for the Organization, or refreshes the account
 * details of one already recorded. The installation id is unique across
 * Organizations, so an App reinstalled elsewhere updates its row rather than
 * creating a second one.
 */
export async function upsertGitHubInstallation({
  organizationId,
  installationId,
  installedById,
  account,
}: {
  organizationId: string;
  installationId: number;
  installedById: string;
  account: GitHubInstallationAccount;
}) {
  const accountColumns = {
    accountLogin: account.login,
    accountType: account.type,
    accountAvatarUrl: account.avatarUrl,
  };

  await prisma.gitHubInstallation.upsert({
    where: { installationId },
    update: accountColumns,
    create: {
      organizationId,
      installationId,
      ...accountColumns,
      installedById,
    },
  });
}
