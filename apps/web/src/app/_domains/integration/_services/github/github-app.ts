import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/core";

const appId = process.env.GITHUB_APP_ID!;
const privateKey = process.env.GITHUB_PRIVATE_KEY!.replace(/\\n/g, "\n");

export function getAppOctokit() {
  return new Octokit({
    authStrategy: createAppAuth,
    auth: { appId, privateKey },
  });
}

export function getInstallationOctokit(installationId: number) {
  return new Octokit({
    authStrategy: createAppAuth,
    auth: { appId, privateKey, installationId },
  });
}
