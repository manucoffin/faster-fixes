"use server";

import { auth } from "@/server/auth";
import { getInstallationOctokit } from "@/server/github/github-app";
import { protectedProcedure } from "@/server/trpc/trpc";
import { TRPCError, inferProcedureOutput } from "@trpc/server";
import { headers } from "next/headers";

export const listAccessibleRepos = protectedProcedure.query(async ({ ctx }) => {
  const { prisma, session } = ctx;

  const activeOrganization = await auth.api.getFullOrganization({
    headers: await headers(),
  });

  if (!activeOrganization) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "No active organization.",
    });
  }

  const membership = await prisma.member.findFirst({
    where: {
      organizationId: activeOrganization.id,
      userId: session.user.id,
      role: { in: ["owner", "admin"] },
    },
  });

  if (!membership) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only owners and admins can list repositories.",
    });
  }

  const installation = await prisma.gitHubInstallation.findFirst({
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
});

export type ListAccessibleReposOutput = inferProcedureOutput<typeof listAccessibleRepos>;
