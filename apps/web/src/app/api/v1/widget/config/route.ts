import { handlePreflight, withCors } from "@/server/api/cors";
import { resolveProject } from "@/server/api/resolve-project";
import { NextRequest, NextResponse } from "next/server";

export async function OPTIONS(req: NextRequest) {
  return handlePreflight(req) ?? new NextResponse(null, { status: 204 });
}

export async function GET(req: NextRequest) {
  const project = await resolveProject(req.headers.get("x-api-key"));
  if (!project) {
    return withCors(req, NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
  }

  const config = project.widgetConfig;

  return withCors(
    req,
    NextResponse.json({
      enabled: config?.enabled ?? true,
      color: config?.color ?? "#6366f1",
      position: config?.position ?? "bottom-right",
    }),
  );
}
