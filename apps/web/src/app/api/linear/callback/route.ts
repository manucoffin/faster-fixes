import { auth } from "@/server/auth";
import { encryptToken } from "@/server/linear/crypto";
import {
  exchangeOAuthCode,
  getLinearClient,
  getLinearOAuthRedirectUri,
} from "@/server/linear/linear-client";
import { prisma } from "@workspace/db";
import { type NextRequest, NextResponse } from "next/server";

const STATE_COOKIE_NAME = "linear_oauth_state";

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

  const stateCookie = req.cookies.get(STATE_COOKIE_NAME)?.value;
  if (!stateCookie || stateCookie !== stateParam) {
    return NextResponse.redirect(`${integrationsUrl}?error=linear_state_mismatch`);
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
    tokenResponse = await exchangeOAuthCode(code, getLinearOAuthRedirectUri());
  } catch {
    return NextResponse.redirect(
      `${integrationsUrl}?error=linear_token_exchange_failed`,
    );
  }

  const linearClient = getLinearClient(tokenResponse.access_token);
  let viewerOrg: { id: string; name: string; urlKey: string };
  try {
    const org = await linearClient.organization;
    viewerOrg = { id: org.id, name: org.name, urlKey: org.urlKey };
  } catch {
    return NextResponse.redirect(
      `${integrationsUrl}?error=linear_org_fetch_failed`,
    );
  }

  const expiresAt = tokenResponse.expires_in
    ? new Date(Date.now() + tokenResponse.expires_in * 1000)
    : null;

  await prisma.linearInstallation.upsert({
    where: { organizationId: activeOrganization.id },
    update: {
      linearOrgId: viewerOrg.id,
      linearOrgName: viewerOrg.name,
      linearOrgUrlKey: viewerOrg.urlKey,
      accessToken: encryptToken(tokenResponse.access_token),
      refreshToken: tokenResponse.refresh_token
        ? encryptToken(tokenResponse.refresh_token)
        : null,
      tokenScope: tokenResponse.scope,
      tokenExpiresAt: expiresAt,
      installedById: membership.id,
    },
    create: {
      organizationId: activeOrganization.id,
      linearOrgId: viewerOrg.id,
      linearOrgName: viewerOrg.name,
      linearOrgUrlKey: viewerOrg.urlKey,
      accessToken: encryptToken(tokenResponse.access_token),
      refreshToken: tokenResponse.refresh_token
        ? encryptToken(tokenResponse.refresh_token)
        : null,
      tokenScope: tokenResponse.scope,
      tokenExpiresAt: expiresAt,
      installedById: membership.id,
    },
  });

  const response = NextResponse.redirect(`${integrationsUrl}?linear=connected`);
  response.cookies.delete(STATE_COOKIE_NAME);
  return response;
}
