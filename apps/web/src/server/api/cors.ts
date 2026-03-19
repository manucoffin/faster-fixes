import { NextRequest, NextResponse } from "next/server";

const ALLOWED_HEADERS = [
  "X-API-Key",
  "X-Reviewer-Token",
  "Content-Type",
].join(", ");

const ALLOWED_METHODS = "GET, POST, PUT, DELETE, OPTIONS";

// Cache preflight responses for 1 hour
const MAX_AGE = "3600";

/**
 * Returns CORS headers for a given request origin.
 * The origin is validated against the project URL at the route level —
 * this helper just sets the response headers.
 */
export function corsHeaders(origin: string): HeadersInit {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": ALLOWED_METHODS,
    "Access-Control-Allow-Headers": ALLOWED_HEADERS,
    "Access-Control-Max-Age": MAX_AGE,
  };
}

/**
 * Handles OPTIONS preflight requests.
 * Call this from route handlers that need CORS.
 */
export function handlePreflight(req: NextRequest): NextResponse | null {
  if (req.method !== "OPTIONS") return null;

  const origin = req.headers.get("origin");
  if (!origin) {
    return new NextResponse(null, { status: 204 });
  }

  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}

/**
 * Wraps a NextResponse with CORS headers derived from the request origin.
 */
export function withCors(req: NextRequest, res: NextResponse): NextResponse {
  const origin = req.headers.get("origin");
  if (origin) {
    const headers = corsHeaders(origin);
    for (const [key, value] of Object.entries(headers)) {
      res.headers.set(key, value);
    }
  }
  return res;
}
