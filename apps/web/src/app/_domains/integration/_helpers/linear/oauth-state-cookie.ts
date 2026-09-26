import type { OAuthStateCookie } from "../../_services/oauth-state-cookie";

// Shared between the Linear OAuth `/install` (sets) and `/callback` (reads,
// deletes) routes. The two MUST agree, so the config lives in one place.
export const LINEAR_OAUTH_STATE_COOKIE: OAuthStateCookie = {
  name: "linear_oauth_state",
  maxAgeSeconds: 600,
};
