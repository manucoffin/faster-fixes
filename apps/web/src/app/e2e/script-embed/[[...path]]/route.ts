import type { NextRequest } from "next/server";

import { buildScriptEmbedPage } from "../../_helpers/build-script-embed-page";

export async function GET(request: NextRequest) {
  // A test fixture: `next build` sets NODE_ENV, so no deployment serves it.
  if (process.env.NODE_ENV === "production") {
    return new Response("Not found", { status: 404 });
  }

  const { pathname, searchParams } = request.nextUrl;
  const html = buildScriptEmbedPage({
    pathname,
    projectId: process.env.NEXT_PUBLIC_FF_API_KEY ?? "",
    apiOrigin: process.env.NEXT_PUBLIC_FF_API_ORIGIN,
    autoInit: !searchParams.has("manual"),
    color: searchParams.get("color"),
    position: searchParams.get("position"),
  });
  if (!html) return new Response("Not found", { status: 404 });

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
