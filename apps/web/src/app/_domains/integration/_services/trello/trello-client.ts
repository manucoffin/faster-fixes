// Trello OAuth 2.0 (3LO) runs on Atlassian's authorization server, but every
// resource call goes to trello.com with a Bearer token, unlike Jira's
// api.atlassian.com gateway. The flow requires PKCE even from a confidential
// client.
import { createHash, randomBytes } from "crypto";
import { IntegrationConfigurationError } from "../integration-configuration-error";
import { TrelloRequestError } from "./trello-request-error";

export const TRELLO_OAUTH_AUTHORIZE_URL =
  "https://auth.atlassian.com/authorize";
const TRELLO_OAUTH_TOKEN_URL = "https://auth.atlassian.com/oauth/token";
const TRELLO_API_BASE_URL = "https://api.trello.com/1";

// `offline_access` is what makes Atlassian return a refresh token; without it
// the connection would die at the first access-token expiry. read:member names
// the authorizing member; read/write:board cover boards, lists, cards and
// attachments.
export const TRELLO_OAUTH_SCOPES =
  "read:member:trello read:board:trello write:board:trello offline_access";

export type TrelloTokenResponse = {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in?: number;
  scope: string;
};

export type TrelloMember = {
  id: string;
  fullName: string;
  username: string;
};

function getClientCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.TRELLO_CLIENT_ID;
  const clientSecret = process.env.TRELLO_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new IntegrationConfigurationError(
      "TRELLO_CLIENT_ID / TRELLO_CLIENT_SECRET are not set.",
    );
  }
  return { clientId, clientSecret };
}

export async function exchangeOAuthCode({
  code,
  redirectUri,
  codeVerifier,
}: {
  code: string;
  redirectUri: string;
  codeVerifier: string;
}): Promise<TrelloTokenResponse> {
  const { clientId, clientSecret } = getClientCredentials();

  const res = await fetch(TRELLO_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }),
  });

  if (!res.ok) {
    throw new TrelloRequestError(res.status, await res.text(), "/oauth/token");
  }

  return (await res.json()) as TrelloTokenResponse;
}

export async function getAuthorizedMember(
  accessToken: string,
): Promise<TrelloMember> {
  const path = "/members/me?fields=id,fullName,username";
  const res = await fetch(`${TRELLO_API_BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    throw new TrelloRequestError(res.status, await res.text(), path);
  }

  return (await res.json()) as TrelloMember;
}

export function getTrelloOAuthRedirectUri(): string {
  const explicit = process.env.TRELLO_OAUTH_REDIRECT_URI;
  if (explicit) return explicit;
  const base = process.env.BETTER_AUTH_URL ?? process.env.BASE_URL;
  if (!base) {
    throw new IntegrationConfigurationError(
      "Cannot resolve Trello OAuth redirect URI: set TRELLO_OAUTH_REDIRECT_URI or BETTER_AUTH_URL.",
    );
  }
  return `${base.replace(/\/$/, "")}/api/trello/callback`;
}

export function createPkcePair(): {
  codeVerifier: string;
  codeChallenge: string;
} {
  const codeVerifier = randomBytes(32).toString("base64url");
  const codeChallenge = createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");
  return { codeVerifier, codeChallenge };
}
