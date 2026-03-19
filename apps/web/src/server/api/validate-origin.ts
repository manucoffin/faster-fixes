/**
 * Validates that the request origin matches the project's registered URL.
 * Compares origins (protocol + host) to allow subpaths.
 */
export function validateOrigin(
  headers: Headers,
  projectUrl: string,
): boolean {
  const origin = headers.get("origin") ?? headers.get("referer");
  if (!origin) return false;

  try {
    const requestOrigin = new URL(origin).origin;
    const projectOrigin = new URL(projectUrl).origin;
    return requestOrigin === projectOrigin;
  } catch {
    return false;
  }
}
