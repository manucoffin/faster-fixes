import { type NextRequest, NextResponse } from "next/server";

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

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
    // Match all routes except Next.js internals, static files, and API routes
    "/((?!api|_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt).*)",
  ],
};
