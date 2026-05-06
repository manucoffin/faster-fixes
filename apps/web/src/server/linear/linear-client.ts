import { LinearClient } from "@linear/sdk";

const LINEAR_OAUTH_TOKEN_URL = "https://api.linear.app/oauth/token";
const LINEAR_OAUTH_REVOKE_URL = "https://api.linear.app/oauth/revoke";

export function getLinearClient(accessToken: string): LinearClient {
  return new LinearClient({ accessToken });
}

type OAuthTokenResponse = {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  scope: string;
};

export async function exchangeOAuthCode(
  code: string,
  redirectUri: string,
): Promise<OAuthTokenResponse> {
  const clientId = process.env.LINEAR_CLIENT_ID;
  const clientSecret = process.env.LINEAR_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("LINEAR_CLIENT_ID / LINEAR_CLIENT_SECRET are not set.");
  }

  const body = new URLSearchParams({
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "authorization_code",
  });

  const res = await fetch(LINEAR_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Linear token exchange failed (${res.status}): ${text}`);
  }

  return (await res.json()) as OAuthTokenResponse;
}

export async function refreshAccessToken(
  refreshToken: string,
): Promise<OAuthTokenResponse> {
  const clientId = process.env.LINEAR_CLIENT_ID;
  const clientSecret = process.env.LINEAR_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("LINEAR_CLIENT_ID / LINEAR_CLIENT_SECRET are not set.");
  }

  const body = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token",
  });

  const res = await fetch(LINEAR_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Linear token refresh failed (${res.status}): ${text}`);
  }

  return (await res.json()) as OAuthTokenResponse;
}

export async function revokeAccessToken(accessToken: string): Promise<void> {
  const res = await fetch(LINEAR_OAUTH_REVOKE_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  // Linear returns 200 on success; 400 with "invalid_token" if already revoked / expired.
  // Treat "already gone" as success so disconnect is idempotent.
  if (res.ok) return;
  if (res.status === 400) {
    const text = await res.text().catch(() => "");
    if (text.includes("invalid_token")) return;
    throw new Error(`Linear token revoke failed (400): ${text}`);
  }
  const text = await res.text().catch(() => "");
  throw new Error(`Linear token revoke failed (${res.status}): ${text}`);
}

export function getLinearOAuthRedirectUri(): string {
  const explicit = process.env.LINEAR_OAUTH_REDIRECT_URI;
  if (explicit) return explicit;
  const base = process.env.BETTER_AUTH_URL ?? process.env.BASE_URL;
  if (!base) {
    throw new Error(
      "Cannot resolve Linear OAuth redirect URI: set LINEAR_OAUTH_REDIRECT_URI or BETTER_AUTH_URL.",
    );
  }
  return `${base.replace(/\/$/, "")}/api/linear/callback`;
}
