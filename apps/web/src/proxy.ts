import { type NextRequest, NextResponse } from "next/server";

import { corsHeaders } from "@/server/api/cors";
import { isCloud } from "@/utils/environment/env";

// Routes only available on the official cloud-hosted instance.
// Self-hosted users are redirected to /login for these paths.
const CLOUD_ONLY_ROUTES = [
  "/",
  "/pricing",
  "/docs",
  "/blog",
  "/privacy-policy",
  "/terms",
  "/terms-of-sale",
];

// Widget-facing routes that need CORS for cross-origin browser requests
function needsCors(pathname: string): boolean {
  return (
    pathname.startsWith("/api/v1/widget/") ||
    pathname.startsWith("/api/v1/feedback")
  );
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // CORS handling for widget-facing API routes — applied at the proxy level
  // so headers survive any downstream redirects (e.g. trailing-slash 307s)
  if (needsCors(pathname)) {
    const origin = request.headers.get("origin");

    if (request.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 204,
        headers: origin ? corsHeaders(origin) : undefined,
      });
    }

    const response = NextResponse.next();
    if (origin) {
      for (const [key, value] of Object.entries(corsHeaders(origin))) {
        response.headers.set(key, value);
      }
    }
    return response;
  }

  // Cloud/self-hosted proxy
  if (!isCloud() && isCloudOnlyRoute(pathname)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

function isCloudOnlyRoute(pathname: string): boolean {
  // Exact match or prefix match for nested routes (e.g. /docs/getting-started)
  return CLOUD_ONLY_ROUTES.some(
    (route) =>
      pathname === route ||
      (route !== "/" && pathname.startsWith(`${route}/`)),
  );
}

export const config = {
  matcher: [
    // Widget-facing API routes (CORS)
    "/api/v1/widget/:path*",
    "/api/v1/feedback/:path*",
    // Non-static routes (cloud/self-hosted proxy)
    "/((?!api|_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt).*)",
  ],
};
