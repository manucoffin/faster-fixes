import { checkRateLimit } from "@/server/api/check-rate-limit";
import { handlePreflight, withCors } from "@/server/api/cors";
import { resolveProject } from "@/server/api/resolve-project";
import { validateOrigin } from "@/server/api/validate-origin";
import { NextRequest, NextResponse } from "next/server";

export async function OPTIONS(req: NextRequest) {
  return handlePreflight(req) ?? new NextResponse(null, { status: 204 });
}

export async function GET(req: NextRequest) {
  const project = await resolveProject(req.headers.get("x-api-key"));
  if (!project) {
    return withCors(req, NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
  }

  if (!validateOrigin(req.headers, project.url)) {
    return withCors(req, NextResponse.json({ error: "Origin not allowed" }, { status: 403 }));
  }

  const allowed = await checkRateLimit(project.apiKeyHash, "read");
  if (!allowed) {
    return withCors(
      req,
      NextResponse.json(
        { error: "Rate limit exceeded. Try again later." },
        { status: 429 },
      ),
    );
  }

  const config = project.widgetConfig;

  return withCors(
    req,
    NextResponse.json({
      enabled: config?.enabled ?? true,
      color: config?.color ?? "#02527E",
      position: config?.position ?? "bottom-right",
    }),
  );
}
