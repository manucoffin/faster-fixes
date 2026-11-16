import type { OAuthStateCookie } from "../../_services/oauth-state-cookie";

// Shared between the Trello OAuth `/install` (sets) and `/callback` (reads,
// deletes) routes. The two MUST agree, so the config lives in one place.
export const TRELLO_OAUTH_STATE_COOKIE: OAuthStateCookie = {
  name: "trello_oauth_state",
  maxAgeSeconds: 600,
};

// The PKCE code verifier the callback sends with the code exchange. Same
// lifetime as the state, since both belong to one consent round-trip.
export const TRELLO_OAUTH_VERIFIER_COOKIE: OAuthStateCookie = {
  name: "trello_oauth_verifier",
  maxAgeSeconds: 600,
};
