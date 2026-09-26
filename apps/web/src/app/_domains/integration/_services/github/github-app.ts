import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/core";

import { requireEnv } from "@/utils/environment/require-env";

const privateKey = requireEnv(
  "GITHUB_PRIVATE_KEY",
  process.env.GITHUB_PRIVATE_KEY,
).replace(/\\n/g, "\n");

// Read on call, not at import: only the private key has always been required
// to load this module.
function getAppAuth() {
  return {
    appId: requireEnv("GITHUB_APP_ID", process.env.GITHUB_APP_ID),
    privateKey,
  };
}

export function getAppOctokit() {
  return new Octokit({
    authStrategy: createAppAuth,
    auth: getAppAuth(),
  });
}

export function getInstallationOctokit(installationId: number) {
  return new Octokit({
    authStrategy: createAppAuth,
    auth: { ...getAppAuth(), installationId },
  });
}
