import { resolveProject } from "@/server/api/resolve-project";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const project = await resolveProject(req.headers.get("x-api-key"));
  if (!project) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const config = project.widgetConfig;

  return NextResponse.json({
    enabled: config?.enabled ?? true,
    color: config?.color ?? "#6366f1",
    position: config?.position ?? "bottom-right",
  });
}
