import type { OAuthStateCookie } from "../../_services/oauth-state-cookie";

// Shared between the Jira OAuth `/install` (sets) and `/callback` (reads,
// deletes) routes. The two MUST agree, so the config lives in one place.
export const JIRA_OAUTH_STATE_COOKIE: OAuthStateCookie = {
  name: "jira_oauth_state",
  maxAgeSeconds: 600,
};
