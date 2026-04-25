import { normalizeDomain } from "@/app/_features/project/normalize-domain";

// Checked via URL.hostname — parsed, so "localhost.evil.com" does NOT match.
const LOCALHOST_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1"]);

function isLocalhostOrigin(origin: string): boolean {
  try {
    return LOCALHOST_HOSTNAMES.has(new URL(origin).hostname);
  } catch {
    return false;
  }
}

/**
 * Validates that the request origin's host matches the project's registered
 * domain after normalization (lowercased, www. stripped). Protocol, port, and
 * path are ignored, so https://acme.com and http://www.acme.com both match a
 * project domain of "acme.com".
 *
 * Localhost origins are always allowed so developers can test the widget
 * before deploying. The browser Origin header cannot be spoofed by web pages,
 * so this is safe — only code running on the developer's machine can produce
 * a localhost origin. The API key is still required for authentication.
 */
export function validateOrigin(
  headers: Headers,
  projectDomain: string,
): boolean {
  const origin = headers.get("origin") ?? headers.get("referer");
  if (!origin) return false;

  if (isLocalhostOrigin(origin)) return true;

  const requestDomain = normalizeDomain(origin);
  const expected = normalizeDomain(projectDomain);
  if (!requestDomain || !expected) return false;

  return requestDomain === expected;
}
