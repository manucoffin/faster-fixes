import { auth } from "@/server/auth";
import { findInstallingMember } from "@/app/_domains/integration/_services/find-installing-member";
import {
  JIRA_OAUTH_AUTHORIZE_URL,
  JIRA_OAUTH_SCOPES,
  getJiraOAuthRedirectUri,
} from "@/app/_domains/integration/_services/jira/jira-client";
import { JIRA_OAUTH_STATE_COOKIE } from "@/app/_domains/integration/_helpers/jira/oauth-state-cookie";
import {
  createOAuthState,
  setOAuthStateCookie,
} from "@/app/_domains/integration/_services/oauth-state-cookie";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const baseUrl = process.env.BETTER_AUTH_URL ?? process.env.BASE_URL!;
  const integrationsUrl = `${baseUrl}/integrations`;

  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.redirect(
      `${baseUrl}/login?nextUrl=${encodeURIComponent(`${baseUrl}/api/jira/install`)}`,
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

  const clientId = process.env.JIRA_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(
      `${integrationsUrl}?error=jira_not_configured`,
    );
  }

  const state = createOAuthState();
  const redirectUri = getJiraOAuthRedirectUri();

  const authorizeUrl = new URL(JIRA_OAUTH_AUTHORIZE_URL);
  authorizeUrl.searchParams.set("audience", "api.atlassian.com");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("scope", JIRA_OAUTH_SCOPES);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("response_type", "code");
  // `consent` forces Atlassian to (re)issue a refresh token even on reconnect.
  authorizeUrl.searchParams.set("prompt", "consent");
  authorizeUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(authorizeUrl.toString());
  setOAuthStateCookie(response, JIRA_OAUTH_STATE_COOKIE, state);
  return response;
}
