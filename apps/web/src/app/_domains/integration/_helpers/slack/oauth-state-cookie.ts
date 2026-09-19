// Shared between the Slack OAuth `/install` (sets) and `/callback` (reads,
// deletes) routes. The two MUST agree, so the constant lives in one place.
export const SLACK_OAUTH_STATE_COOKIE = "slack_oauth_state";
export const SLACK_OAUTH_STATE_COOKIE_MAX_AGE_S = 600;
