import { auth } from "@/server/auth";
import { BadRequestError, ForbiddenError } from "@/server/errors/domain-errors";
import { getInstallationOctokit } from "@/app/_domains/integration/_services/github/github-app";
import { prisma } from "@workspace/db";

export async function listAccessibleRepos(
  { userId, headers }: { userId: string; headers: Headers },
  db: typeof prisma = prisma,
) {
  const activeOrganization = await auth.api.getFullOrganization({ headers });

  if (!activeOrganization) {
    throw new BadRequestError("No active organization.");
  }

  // The privileged-membership denial needs the resolved Organization, so it
  // lives here rather than at the transport edge.
  const membership = await db.member.findFirst({
    where: {
      organizationId: activeOrganization.id,
      userId,
      role: { in: ["owner", "admin"] },
    },
  });

  if (!membership) {
    throw new ForbiddenError("Only owners and admins can list repositories.");
  }

  const installation = await db.gitHubInstallation.findFirst({
    where: { organizationId: activeOrganization.id },
  });

  if (!installation) {
    return [];
  }

  const octokit = getInstallationOctokit(installation.installationId);

  const repos: {
    id: number;
    fullName: string;
    private: boolean;
    defaultBranch: string;
  }[] = [];

  let page = 1;
  while (true) {
    const response = await octokit.request("GET /installation/repositories", {
      per_page: 100,
      page,
    });

    const data = response.data as {
      repositories: Array<{
        id: number;
        full_name: string;
        private: boolean;
        default_branch: string;
      }>;
    };

    for (const repo of data.repositories) {
      repos.push({
        id: repo.id,
        fullName: repo.full_name,
        private: repo.private,
        defaultBranch: repo.default_branch,
      });
    }

    if (data.repositories.length < 100) break;
    page++;
  }

  return repos;
}

export type ListAccessibleReposOutput = Awaited<
  ReturnType<typeof listAccessibleRepos>
>;
