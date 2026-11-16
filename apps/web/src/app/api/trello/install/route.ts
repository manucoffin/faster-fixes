import { auth } from "@/server/auth";
import { findInstallingMember } from "@/app/_domains/integration/_services/find-installing-member";
import {
  TRELLO_OAUTH_AUTHORIZE_URL,
  TRELLO_OAUTH_SCOPES,
  createPkcePair,
  getTrelloOAuthRedirectUri,
} from "@/app/_domains/integration/_services/trello/trello-client";
import {
  TRELLO_OAUTH_STATE_COOKIE,
  TRELLO_OAUTH_VERIFIER_COOKIE,
} from "@/app/_domains/integration/_helpers/trello/oauth-state-cookie";
import {
  createOAuthState,
  setOAuthStateCookie,
} from "@/app/_domains/integration/_services/oauth-state-cookie";
import { getAuthBaseUrl } from "@/utils/url/get-auth-base-url";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const baseUrl = getAuthBaseUrl();
  const integrationsUrl = `${baseUrl}/integrations`;

  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.redirect(
      `${baseUrl}/login?nextUrl=${encodeURIComponent(`${baseUrl}/api/trello/install`)}`,
    );
  }

  const activeOrganization = await auth.api.getFullOrganization({
    headers: req.headers,
  });
  if (!activeOrganization) {
    return NextResponse.redirect(`${integrationsUrl}?error=no_active_org`);
  }

  const installingMember = await findInstallingMember({
    organizationId: activeOrganization.id,
    userId: session.user.id,
  });
  if (!installingMember) {
    return NextResponse.redirect(`${integrationsUrl}?error=insufficient_role`);
  }

  // The secret is only read at the callback, but without it the consent screen
  // would lead to an exchange that cannot succeed.
  const clientId = process.env.TRELLO_CLIENT_ID;
  if (!clientId || !process.env.TRELLO_CLIENT_SECRET) {
    return NextResponse.redirect(
      `${integrationsUrl}?error=trello_not_configured`,
    );
  }

  const state = createOAuthState();
  const { codeVerifier, codeChallenge } = createPkcePair();
  const redirectUri = getTrelloOAuthRedirectUri();

  const authorizeUrl = new URL(TRELLO_OAUTH_AUTHORIZE_URL);
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("scope", TRELLO_OAUTH_SCOPES);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("prompt", "consent");
  authorizeUrl.searchParams.set("code_challenge", codeChallenge);
  authorizeUrl.searchParams.set("code_challenge_method", "S256");
  authorizeUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(authorizeUrl.toString());
  setOAuthStateCookie(response, TRELLO_OAUTH_STATE_COOKIE, state);
  setOAuthStateCookie(response, TRELLO_OAUTH_VERIFIER_COOKIE, codeVerifier);
  return response;
}
