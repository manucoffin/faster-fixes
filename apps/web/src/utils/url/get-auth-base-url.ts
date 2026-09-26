import { requireEnv } from "@/utils/environment/require-env";

// The public origin OAuth redirects and integration links are built on.
export function getAuthBaseUrl() {
  return requireEnv(
    "BETTER_AUTH_URL or BASE_URL",
    process.env.BETTER_AUTH_URL ?? process.env.BASE_URL,
  );
}
