import { findInstallingMember } from "@/app/_domains/integration/_services/find-installing-member";
import { findLinearOrganization } from "@/app/_domains/integration/_services/linear/find-linear-organization";
import {
  exchangeOAuthCode,
  getLinearOAuthRedirectUri,
} from "@/app/_domains/integration/_services/linear/linear-client";
import { upsertLinearInstallation } from "@/app/_domains/integration/_services/linear/upsert-linear-installation";
import { LINEAR_OAUTH_STATE_COOKIE } from "@/app/_domains/integration/_helpers/linear/oauth-state-cookie";
import {
  clearOAuthStateCookie,
  isValidOAuthState,
} from "@/app/_domains/integration/_services/oauth-state-cookie";
import { auth } from "@/server/auth";
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
      `${integrationsUrl}?error=linear_oauth_${encodeURIComponent(error)}`,
    );
  }

  if (!code || !stateParam) {
    return NextResponse.redirect(
      `${integrationsUrl}?error=linear_missing_code_or_state`,
    );
  }

  if (!isValidOAuthState(req, LINEAR_OAUTH_STATE_COOKIE, stateParam)) {
    return NextResponse.redirect(
      `${integrationsUrl}?error=linear_state_mismatch`,
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

  let tokens;
  try {
    tokens = await exchangeOAuthCode(code, getLinearOAuthRedirectUri());
  } catch {
    return NextResponse.redirect(
      `${integrationsUrl}?error=linear_token_exchange_failed`,
    );
  }

  const organization = await findLinearOrganization(tokens.access_token);
  if (!organization) {
    return NextResponse.redirect(
      `${integrationsUrl}?error=linear_org_fetch_failed`,
    );
  }

  await upsertLinearInstallation({
    organizationId: activeOrganization.id,
    installedById: installingMember.id,
    organization,
    tokens,
  });

  const response = NextResponse.redirect(`${integrationsUrl}?linear=connected`);
  clearOAuthStateCookie(response, LINEAR_OAUTH_STATE_COOKIE);
  return response;
}
