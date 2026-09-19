import { getAppOctokit } from "./github-app";

/** The GitHub account (user or organization) an App installation belongs to. */
export type GitHubInstallationAccount = {
  login: string;
  type: string;
  avatarUrl: string | null;
};

type InstallationResponseData = {
  account: { login: string; type: string; avatar_url?: string };
};

/**
 * The account behind an App installation id, or `null` when GitHub does not
 * answer for it. An unknown installation and an unreachable GitHub collapse
 * into the same `null`, because the only thing the caller can do with either is
 * send the User back to install the App again.
 */
export async function findGitHubInstallationAccount(installationId: number) {
  try {
    const response = await getAppOctokit().request(
      "GET /app/installations/{installation_id}",
      { installation_id: installationId },
    );
    const { account } = response.data as InstallationResponseData;

    return {
      login: account.login,
      type: account.type,
      avatarUrl: account.avatar_url ?? null,
    } satisfies GitHubInstallationAccount;
  } catch {
    return null;
  }
}

export type FindGitHubInstallationAccountOutput = Awaited<
  ReturnType<typeof findGitHubInstallationAccount>
>;
