// Trello OAuth 2.0 (3LO) runs on Atlassian's authorization server, but every
// resource call goes to trello.com with a Bearer token, unlike Jira's
// api.atlassian.com gateway. The flow requires PKCE even from a confidential
// client.
import { createHash, randomBytes } from "crypto";
import { IntegrationConfigurationError } from "../integration-configuration-error";

export const TRELLO_OAUTH_AUTHORIZE_URL =
  "https://auth.atlassian.com/authorize";

// `offline_access` is what makes Atlassian return a refresh token; without it
// the connection would die at the first access-token expiry. read:member names
// the authorizing member; read/write:board cover boards, lists, cards and
// attachments.
export const TRELLO_OAUTH_SCOPES =
  "read:member:trello read:board:trello write:board:trello offline_access";

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
