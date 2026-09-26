import { randomBytes } from "crypto";
import type { NextRequest, NextResponse } from "next/server";

// The OAuth `state` parameter defends the install/callback round-trip against
// CSRF: `/install` mints a random value, stores it in an httpOnly cookie and
// echoes it to the provider; `/callback` only proceeds when the returned
// `state` matches the cookie. Shared verbatim across Tracker integrations
// (Linear, Jira, …) so the CSRF check stays identical everywhere, which is
// why it sits at the bucket root rather than under a provider: only the
// cookie name and lifetime differ, and those are the provider's constant.
export type OAuthStateCookie = {
  name: string;
  maxAgeSeconds: number;
};

export function createOAuthState(): string {
  return randomBytes(32).toString("hex");
}

export function setOAuthStateCookie(
  response: NextResponse,
  cookie: OAuthStateCookie,
  state: string,
): void {
  response.cookies.set(cookie.name, state, {
    httpOnly: true,
    // Lax (not Strict) so the cookie survives the top-level redirect back from
    // the provider on the callback.
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: cookie.maxAgeSeconds,
  });
}

export function isValidOAuthState(
  request: NextRequest,
  cookie: OAuthStateCookie,
  stateParam: string | null,
): boolean {
  const stored = request.cookies.get(cookie.name)?.value;
  return Boolean(stored && stateParam && stored === stateParam);
}

export function clearOAuthStateCookie(
  response: NextResponse,
  cookie: OAuthStateCookie,
): void {
  response.cookies.delete(cookie.name);
}
