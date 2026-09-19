import { auth } from "@/server/auth";
import {
  SLACK_OAUTH_STATE_COOKIE,
  SLACK_OAUTH_STATE_COOKIE_MAX_AGE_S,
} from "@/app/_domains/integration/_helpers/slack/oauth-state-cookie";
import { hasSlackIntegrationAccess } from "@/app/_domains/integration/_services/slack/has-slack-integration-access";
import { SLACK_OAUTH_SCOPES } from "@/app/_domains/integration/_services/slack/slack-client";
import { randomBytes } from "crypto";
import { type NextRequest, NextResponse } from "next/server";

const SLACK_OAUTH_AUTHORIZE_URL = "https://slack.com/oauth/v2/authorize";

export async function GET(req: NextRequest) {
  const baseUrl = process.env.BETTER_AUTH_URL ?? process.env.BASE_URL!;
  const integrationsUrl = `${baseUrl}/integrations`;

  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.redirect(
      `${baseUrl}/login?nextUrl=${encodeURIComponent(`${baseUrl}/api/slack/install`)}`,
    );
  }

  const activeOrganization = await auth.api.getFullOrganization({
    headers: req.headers,
  });
  if (!activeOrganization) {
    return NextResponse.redirect(`${integrationsUrl}?error=no_active_org`);
  }

  const planAllowsSlack = await hasSlackIntegrationAccess(
    activeOrganization.id,
  );
  if (!planAllowsSlack) {
    return NextResponse.redirect(`${integrationsUrl}?error=upgrade_required`);
  }

  const clientId = process.env.SLACK_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(
      `${integrationsUrl}?error=slack_not_configured`,
    );
  }

  const state = randomBytes(32).toString("hex");
  const redirectUri = `${baseUrl}/api/slack/callback`;

  const authorizeUrl = new URL(SLACK_OAUTH_AUTHORIZE_URL);
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("scope", SLACK_OAUTH_SCOPES);
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);

  const response = NextResponse.redirect(authorizeUrl.toString());
  response.cookies.set(SLACK_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SLACK_OAUTH_STATE_COOKIE_MAX_AGE_S,
  });
  return response;
}
