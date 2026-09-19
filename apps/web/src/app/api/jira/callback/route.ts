import { auth } from "@/server/auth";
import { inngest } from "@/server/inngest";
import { encryptToken } from "@/server/jira/crypto";
import {
  exchangeOAuthCode,
  getAccessibleResources,
  getJiraOAuthRedirectUri,
} from "@/server/jira/jira-client";
import { JIRA_OAUTH_STATE_COOKIE } from "@/server/jira/oauth-state-cookie";
import {
  clearOAuthStateCookie,
  isValidOAuthState,
} from "@/app/_domains/integration/_services/oauth-state-cookie";
import { prisma } from "@workspace/db";
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

  const membership = await prisma.member.findFirst({
    where: {
      organizationId: activeOrganization.id,
      userId: session.user.id,
      role: { in: ["owner", "admin"] },
    },
  });
  if (!membership) {
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

  let resources;
  try {
    resources = await getAccessibleResources(tokenResponse.access_token);
  } catch {
    return NextResponse.redirect(
      `${integrationsUrl}?error=jira_sites_fetch_failed`,
    );
  }

  if (resources.length === 0) {
    return NextResponse.redirect(`${integrationsUrl}?error=jira_no_sites`);
  }

  // Exactly one accessible site → store it directly. Several → store the first as
  // a provisional selection and route the user to the in-page site picker to
  // finalize, so exactly one site is persisted per Organization either way. The
  // picker re-reads the live accessible-resources rather than trusting a stored
  // list, so no re-exchange (which would rotate the refresh token) is needed.
  const singleSite = resources.length === 1;
  const provisional = resources[0]!;
  const healthState = singleSite ? "connected" : "pending_site_selection";

  const expiresAt = tokenResponse.expires_in
    ? new Date(Date.now() + tokenResponse.expires_in * 1000)
    : null;

  const tokenFields = {
    cloudId: provisional.id,
    siteUrl: provisional.url,
    siteName: provisional.name,
    accessToken: encryptToken(tokenResponse.access_token),
    refreshToken: tokenResponse.refresh_token
      ? encryptToken(tokenResponse.refresh_token)
      : null,
    tokenScope: tokenResponse.scope,
    tokenExpiresAt: expiresAt,
    healthState,
    // Reconnecting re-arms the revocation email for the next time it happens.
    // Project links are untouched by this upsert, so sync resumes as it was.
    reconnectNotifiedAt: null,
    installedById: membership.id,
  };

  const installation = await prisma.jiraInstallation.upsert({
    where: { organizationId: activeOrganization.id },
    update: tokenFields,
    create: { organizationId: activeOrganization.id, ...tokenFields },
    select: { id: true },
  });

  // Registrations may have lapsed while the grant was dead — Jira expires them
  // after 30 days regardless of why nobody refreshed them. Waiting for the weekly
  // cron would leave inbound sync quiet for up to a week after a reconnect that
  // the user was told resumes syncing, so renew (or re-register) immediately.
  if (healthState === "connected") {
    await inngest.send({
      name: "jira/webhooks.refresh-requested",
      data: { installationId: installation.id },
    });
  }

  const response = NextResponse.redirect(
    `${integrationsUrl}?jira=${singleSite ? "connected" : "select_site"}`,
  );
  clearOAuthStateCookie(response, JIRA_OAUTH_STATE_COOKIE);
  return response;
}
