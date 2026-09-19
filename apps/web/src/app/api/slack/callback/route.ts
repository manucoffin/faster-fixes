import { auth } from "@/server/auth";
import { findInstallingMember } from "@/app/_domains/integration/_services/find-installing-member";
import { SLACK_OAUTH_STATE_COOKIE } from "@/app/_domains/integration/_helpers/slack/oauth-state-cookie";
import { exchangeOAuthCode } from "@/app/_domains/integration/_services/slack/slack-client";
import { upsertSlackInstallation } from "@/app/_domains/integration/_services/slack/upsert-slack-installation";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const baseUrl = process.env.BETTER_AUTH_URL ?? process.env.BASE_URL!;
  const integrationsUrl = `${baseUrl}/integrations`;
  const { searchParams } = req.nextUrl;

  const code = searchParams.get("code");
  const stateParam = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(`${integrationsUrl}?slack=error`);
  }

  if (!code || !stateParam) {
    return NextResponse.redirect(`${integrationsUrl}?slack=error`);
  }

  const stateCookie = req.cookies.get(SLACK_OAUTH_STATE_COOKIE)?.value;
  if (!stateCookie || stateCookie !== stateParam) {
    return NextResponse.redirect(`${integrationsUrl}?slack=error`);
  }

  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.redirect(`${integrationsUrl}?slack=error`);
  }

  const activeOrganization = await auth.api.getFullOrganization({
    headers: req.headers,
  });
  if (!activeOrganization) {
    return NextResponse.redirect(`${integrationsUrl}?slack=error`);
  }

  const installingMember = await findInstallingMember({
    organizationId: activeOrganization.id,
    userId: session.user.id,
  });
  if (!installingMember) {
    return NextResponse.redirect(`${integrationsUrl}?slack=error`);
  }

  let grant;
  try {
    grant = await exchangeOAuthCode({
      code,
      redirectUri: `${baseUrl}/api/slack/callback`,
    });
  } catch {
    return NextResponse.redirect(`${integrationsUrl}?slack=error`);
  }

  await upsertSlackInstallation({
    organizationId: activeOrganization.id,
    installedById: installingMember.id,
    grant,
  });

  const response = NextResponse.redirect(`${integrationsUrl}?slack=connected`);
  response.cookies.delete(SLACK_OAUTH_STATE_COOKIE);
  return response;
}
