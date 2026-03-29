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
 * Validates that the request origin matches the project's registered URL.
 * Compares origins (protocol + host) to allow subpaths.
 *
 * Localhost origins are always allowed so developers can test the widget
 * before deploying. The browser Origin header cannot be spoofed by web pages,
 * so this is safe — only code running on the developer's machine can produce
 * a localhost origin. The API key is still required for authentication.
 */
export function validateOrigin(
  headers: Headers,
  projectUrl: string,
): boolean {
  const origin = headers.get("origin") ?? headers.get("referer");
  if (!origin) return false;

  if (isLocalhostOrigin(origin)) return true;

  try {
    const requestOrigin = new URL(origin).origin;
    const projectOrigin = new URL(projectUrl).origin;
    return requestOrigin === projectOrigin;
  } catch {
    return false;
  }
}
