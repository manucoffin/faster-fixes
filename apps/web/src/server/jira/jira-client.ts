// Atlassian OAuth 2.0 (3LO) endpoints. Authorization and token exchange happen on
// auth.atlassian.com; every resource call (including accessible-resources) goes
// through the api.atlassian.com gateway. See ADR 0008.
import { JiraRequestError } from "./jira-rest-client";

export const JIRA_OAUTH_AUTHORIZE_URL = "https://auth.atlassian.com/authorize";
const JIRA_OAUTH_TOKEN_URL = "https://auth.atlassian.com/oauth/token";
const JIRA_ACCESSIBLE_RESOURCES_URL =
  "https://api.atlassian.com/oauth/token/accessible-resources";

// Scopes requested at install. `offline_access` is what makes Atlassian return a
// refresh token; without it the connection would die at the first access-token
// expiry. read/write:jira-work cover issue mirroring; read:jira-user is needed
// later for attribution lookups. `manage:jira-webhook` is what lets a 3LO app
// call the dynamic webhook API at all — without it registration 401s and inbound
// status sync never starts, so installations predating it must re-authorize.
export const JIRA_OAUTH_SCOPES =
  "read:jira-work write:jira-work read:jira-user manage:jira-webhook offline_access";

export type JiraTokenResponse = {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  scope: string;
};

export type JiraAccessibleResource = {
  id: string; // cloudId
  url: string;
  name: string;
  scopes: string[];
  avatarUrl?: string;
};

function getClientCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.JIRA_CLIENT_ID;
  const clientSecret = process.env.JIRA_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("JIRA_CLIENT_ID / JIRA_CLIENT_SECRET are not set.");
  }
  return { clientId, clientSecret };
}

export async function exchangeOAuthCode(
  code: string,
  redirectUri: string,
): Promise<JiraTokenResponse> {
  const { clientId, clientSecret } = getClientCredentials();

  // Atlassian's token endpoint takes a JSON body, unlike Linear's form-encoded one.
  const res = await fetch(JIRA_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Jira token exchange failed (${res.status}): ${text}`);
  }

  return (await res.json()) as JiraTokenResponse;
}

export async function refreshAccessToken(
  refreshToken: string,
): Promise<JiraTokenResponse> {
  const { clientId, clientSecret } = getClientCredentials();

  const res = await fetch(JIRA_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "refresh_token",
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    // The status travels with the error rather than inside its message: the
    // refresh path has to tell an explicit refusal (4xx) from an outage (5xx).
    throw new JiraRequestError(res.status, text, "/oauth/token");
  }

  return (await res.json()) as JiraTokenResponse;
}

export async function getAccessibleResources(
  accessToken: string,
): Promise<JiraAccessibleResource[]> {
  const res = await fetch(JIRA_ACCESSIBLE_RESOURCES_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Jira accessible-resources fetch failed (${res.status}): ${text}`,
    );
  }

  return (await res.json()) as JiraAccessibleResource[];
}

export function getJiraOAuthRedirectUri(): string {
  const explicit = process.env.JIRA_OAUTH_REDIRECT_URI;
  if (explicit) return explicit;
  const base = process.env.BETTER_AUTH_URL ?? process.env.BASE_URL;
  if (!base) {
    throw new Error(
      "Cannot resolve Jira OAuth redirect URI: set JIRA_OAUTH_REDIRECT_URI or BETTER_AUTH_URL.",
    );
  }
  return `${base.replace(/\/$/, "")}/api/jira/callback`;
}
