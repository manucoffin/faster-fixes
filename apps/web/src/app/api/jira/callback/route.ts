import { auth } from "@/server/auth";
import { findInstallingMember } from "@/app/_domains/integration/_services/find-installing-member";
import {
  exchangeOAuthCode,
  getAccessibleResources,
  getJiraOAuthRedirectUri,
} from "@/app/_domains/integration/_services/jira/jira-client";
import { upsertJiraInstallation } from "@/app/_domains/integration/_services/jira/upsert-jira-installation";
import { JIRA_OAUTH_STATE_COOKIE } from "@/app/_domains/integration/_helpers/jira/oauth-state-cookie";
import {
  clearOAuthStateCookie,
  isValidOAuthState,
} from "@/app/_domains/integration/_services/oauth-state-cookie";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const baseUrl = process.env.BETTER_AUTH_URL ?? process.env.BASE_URL!;
  const integrationsUrl = `${baseUrl}/integrations`;
  const { searchParams } = req.nextUrl;

  const code = searchParams.get("code");
  const stateParam = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      `${integrationsUrl}?error=jira_oauth_${encodeURIComponent(error)}`,
    );
  }

  if (!code || !stateParam) {
    return NextResponse.redirect(
      `${integrationsUrl}?error=jira_missing_code_or_state`,
    );
  }

  if (!isValidOAuthState(req, JIRA_OAUTH_STATE_COOKIE, stateParam)) {
    return NextResponse.redirect(
      `${integrationsUrl}?error=jira_state_mismatch`,
    );
  }

  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.redirect(`${integrationsUrl}?error=not_authenticated`);
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

  let tokenResponse;
  try {
    tokenResponse = await exchangeOAuthCode(code, getJiraOAuthRedirectUri());
  } catch {
    return NextResponse.redirect(
      `${integrationsUrl}?error=jira_token_exchange_failed`,
    );
  }

  let sites;
  try {
    sites = await getAccessibleResources(tokenResponse.access_token);
  } catch {
    return NextResponse.redirect(
      `${integrationsUrl}?error=jira_sites_fetch_failed`,
    );
  }

  if (sites.length === 0) {
    return NextResponse.redirect(`${integrationsUrl}?error=jira_no_sites`);
  }

  const { siteSelectionPending } = await upsertJiraInstallation({
    organizationId: activeOrganization.id,
    installedById: installingMember.id,
    sites,
    tokens: tokenResponse,
  });

  const response = NextResponse.redirect(
    `${integrationsUrl}?jira=${siteSelectionPending ? "select_site" : "connected"}`,
  );
  clearOAuthStateCookie(response, JIRA_OAUTH_STATE_COOKIE);
  return response;
}
