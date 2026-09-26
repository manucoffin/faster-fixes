import { IntegrationConfigurationError } from "../integration-configuration-error";
import { SlackRequestError } from "./slack-request-error";

const SLACK_OAUTH_ACCESS_ENDPOINT = "https://slack.com/api/oauth.v2.access";
const SLACK_CONVERSATIONS_LIST_ENDPOINT =
  "https://slack.com/api/conversations.list";
const SLACK_CHAT_POST_MESSAGE_ENDPOINT =
  "https://slack.com/api/chat.postMessage";
const SLACK_CHAT_UPDATE_ENDPOINT = "https://slack.com/api/chat.update";

export const SLACK_OAUTH_SCOPES = "chat:write,chat:write.public,channels:read";

// Slack returns HTTP 200 even on logical failures; the real status is in `ok`.
type SlackResponse = {
  ok: boolean;
  error?: string;
};

type ExchangeOAuthCodeParams = {
  code: string;
  redirectUri: string;
};

/** What Slack grants at the end of the OAuth round-trip: the workspace it is
 * for, and the bot identity the app posts with. */
export type SlackOAuthGrant = {
  botToken: string;
  botUserId: string;
  scope: string;
  teamId: string;
  teamName: string;
};

export async function exchangeOAuthCode({
  code,
  redirectUri,
}: ExchangeOAuthCodeParams): Promise<SlackOAuthGrant> {
  const clientId = process.env.SLACK_CLIENT_ID;
  const clientSecret = process.env.SLACK_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new IntegrationConfigurationError(
      "SLACK_CLIENT_ID / SLACK_CLIENT_SECRET are not set.",
    );
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: redirectUri,
  });

  const res = await fetch(SLACK_OAUTH_ACCESS_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const data = (await res.json()) as SlackResponse & {
    access_token?: string;
    bot_user_id?: string;
    scope?: string;
    team?: { id?: string; name?: string };
  };

  // Slack signals OAuth failures via `ok:false` rather than an HTTP error.
  if (!data.ok) {
    throw new SlackRequestError(
      `Slack OAuth code exchange failed: ${data.error ?? "unknown_error"}`,
    );
  }

  if (
    !data.access_token ||
    !data.bot_user_id ||
    !data.scope ||
    !data.team?.id ||
    !data.team.name
  ) {
    throw new SlackRequestError(
      "Slack OAuth response is missing required fields.",
    );
  }

  return {
    botToken: data.access_token,
    botUserId: data.bot_user_id,
    scope: data.scope,
    teamId: data.team.id,
    teamName: data.team.name,
  };
}

type SlackChannel = {
  id: string;
  name: string;
};

export async function listPublicChannels(
  botToken: string,
): Promise<SlackChannel[]> {
  // Cap pagination so an org with many channels cannot stall the call.
  const MAX_PAGES = 3;
  const channels: SlackChannel[] = [];
  let cursor: string | undefined;

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const url = new URL(SLACK_CONVERSATIONS_LIST_ENDPOINT);
    url.searchParams.set("types", "public_channel");
    url.searchParams.set("exclude_archived", "true");
    url.searchParams.set("limit", "200");
    if (cursor) {
      url.searchParams.set("cursor", cursor);
    }

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${botToken}` },
    });

    const data = (await res.json()) as SlackResponse & {
      channels?: Array<{ id: string; name: string }>;
      response_metadata?: { next_cursor?: string };
    };

    // Slack returns 200 with `ok:false` on auth/permission errors.
    if (!data.ok) {
      throw new SlackRequestError(
        `Slack conversations.list failed: ${data.error ?? "unknown_error"}`,
      );
    }

    for (const channel of data.channels ?? []) {
      channels.push({ id: channel.id, name: channel.name });
    }

    // Slack marks the last page with an empty `next_cursor`.
    cursor = data.response_metadata?.next_cursor;
    if (!cursor) {
      break;
    }
  }

  return channels;
}

// Block Kit blocks are loosely typed; we model only the structures our builders
// emit rather than depending on the full Block Kit type surface.
type SlackBlock = Record<string, unknown>;

type PostMessageParams = {
  botToken: string;
  channel: string;
  blocks: SlackBlock[];
  text: string;
};

export async function postMessage({
  botToken,
  channel,
  blocks,
  text,
}: PostMessageParams): Promise<{ ts: string; channel: string }> {
  const res = await fetch(SLACK_CHAT_POST_MESSAGE_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Authorization: `Bearer ${botToken}`,
    },
    body: JSON.stringify({ channel, blocks, text }),
  });

  const data = (await res.json()) as SlackResponse & {
    ts?: string;
    channel?: string;
  };

  // Slack returns 200 with `ok:false` on errors such as channel_not_found.
  if (!data.ok || !data.ts || !data.channel) {
    throw new SlackRequestError(
      `Slack chat.postMessage failed: ${data.error ?? "unknown_error"}`,
    );
  }

  return { ts: data.ts, channel: data.channel };
}

type UpdateMessageParams = {
  botToken: string;
  channel: string;
  ts: string;
  blocks: SlackBlock[];
  text: string;
};

export async function updateMessage({
  botToken,
  channel,
  ts,
  blocks,
  text,
}: UpdateMessageParams): Promise<void> {
  const res = await fetch(SLACK_CHAT_UPDATE_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Authorization: `Bearer ${botToken}`,
    },
    body: JSON.stringify({ channel, ts, blocks, text }),
  });

  const data = (await res.json()) as SlackResponse;

  // Slack returns 200 with `ok:false` on errors such as message_not_found.
  if (!data.ok) {
    throw new SlackRequestError(
      `Slack chat.update failed: ${data.error ?? "unknown_error"}`,
    );
  }
}
