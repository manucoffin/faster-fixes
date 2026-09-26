const ALLOWED_HEADERS = ["X-API-Key", "X-Reviewer-Token", "Content-Type"].join(
  ", ",
);

const ALLOWED_METHODS = "GET, POST, PUT, DELETE, OPTIONS";

// Cache preflight responses for 1 hour
const MAX_AGE = "3600";

/**
 * Returns CORS headers for a given request origin.
 * The origin is validated against the project URL at the route level —
 * this helper just sets the response headers.
 */
export function corsHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": ALLOWED_METHODS,
    "Access-Control-Allow-Headers": ALLOWED_HEADERS,
    "Access-Control-Max-Age": MAX_AGE,
  };
}
