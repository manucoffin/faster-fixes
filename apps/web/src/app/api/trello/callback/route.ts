import { auth } from "@/server/auth";
import { findInstallingMember } from "@/app/_domains/integration/_services/find-installing-member";
import {
  exchangeOAuthCode,
  getAuthorizedMember,
  getTrelloOAuthRedirectUri,
} from "@/app/_domains/integration/_services/trello/trello-client";
import { upsertTrelloInstallation } from "@/app/_domains/integration/_services/trello/upsert-trello-installation";
import {
  TRELLO_OAUTH_STATE_COOKIE,
  TRELLO_OAUTH_VERIFIER_COOKIE,
} from "@/app/_domains/integration/_helpers/trello/oauth-state-cookie";
import {
  clearOAuthStateCookie,
  isValidOAuthState,
} from "@/app/_domains/integration/_services/oauth-state-cookie";
import { getAuthBaseUrl } from "@/utils/url/get-auth-base-url";
import { type NextRequest, NextResponse } from "next/server";

function clearConsentCookies(response: NextResponse): NextResponse {
  clearOAuthStateCookie(response, TRELLO_OAUTH_STATE_COOKIE);
  clearOAuthStateCookie(response, TRELLO_OAUTH_VERIFIER_COOKIE);
  return response;
}

export async function GET(req: NextRequest) {
  const baseUrl = getAuthBaseUrl();
  const integrationsUrl = `${baseUrl}/integrations`;
  const { searchParams } = req.nextUrl;

  const code = searchParams.get("code");
  const stateParam = searchParams.get("state");
  const error = searchParams.get("error");

  // Atlassian answers a User who declines the consent screen with
  // `access_denied`: that is a choice, not a failure, so the integrations page
  // says nothing was connected rather than reporting an error.
  if (error === "access_denied") {
    return clearConsentCookies(
      NextResponse.redirect(`${integrationsUrl}?trello=cancelled`),
    );
  }

  if (error) {
    return clearConsentCookies(
      NextResponse.redirect(
        `${integrationsUrl}?error=trello_oauth_${encodeURIComponent(error)}`,
      ),
    );
  }

  if (!code || !stateParam) {
    return NextResponse.redirect(
      `${integrationsUrl}?error=trello_missing_code_or_state`,
    );
  }

  if (!isValidOAuthState(req, TRELLO_OAUTH_STATE_COOKIE, stateParam)) {
    return NextResponse.redirect(
      `${integrationsUrl}?error=trello_state_mismatch`,
    );
  }

  const codeVerifier = req.cookies.get(
    TRELLO_OAUTH_VERIFIER_COOKIE.name,
  )?.value;
  if (!codeVerifier) {
    return NextResponse.redirect(
      `${integrationsUrl}?error=trello_state_mismatch`,
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
    tokens = await exchangeOAuthCode({
      code,
      redirectUri: getTrelloOAuthRedirectUri(),
      codeVerifier,
    });
  } catch {
    return NextResponse.redirect(
      `${integrationsUrl}?error=trello_token_exchange_failed`,
    );
  }

  let member;
  try {
    member = await getAuthorizedMember(tokens.access_token);
  } catch {
    return NextResponse.redirect(
      `${integrationsUrl}?error=trello_member_fetch_failed`,
    );
  }

  await upsertTrelloInstallation({
    organizationId: activeOrganization.id,
    installedById: installingMember.id,
    member,
    tokens,
  });

  return clearConsentCookies(
    NextResponse.redirect(`${integrationsUrl}?trello=connected`),
  );
}
