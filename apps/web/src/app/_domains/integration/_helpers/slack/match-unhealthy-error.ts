// Slack errors that mean the channel/bot/token is permanently broken: retrying
// would not help, so callers flip the link unhealthy and surface the cause.
// The match is a substring of the thrown message, so these strings are coupled
// to the `SlackRequestError` messages in `../../_services/slack/slack-client`:
// rewording one there turns a permanently broken link into an endless retry, or
// the reverse. Change the two together.
const UNHEALTHY_SLACK_ERRORS = [
  "channel_not_found",
  "not_in_channel",
  "is_archived",
  "invalid_auth",
  "account_inactive",
  "token_revoked",
];

export function matchUnhealthySlackError(error: unknown): string | null {
  const message = error instanceof Error ? error.message : String(error);
  return UNHEALTHY_SLACK_ERRORS.some((code) => message.includes(code))
    ? message
    : null;
}
