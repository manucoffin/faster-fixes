/**
 * The widget API's HTTP boundary for the widget config: Project resolution, the
 * Allowed origins match and the rate limit live here, so the `_services/`
 * function below stays transport-agnostic. No Reviewer token is required: the
 * config is read by the embedding page before anyone identifies.
 */

import { isAllowedOrigin } from "@/app/_domains/project/_helpers/is-allowed-origin";
import { findProjectByPublicId } from "@/app/_domains/project/_services/find-project-by-public-id";
import { checkRateLimit } from "@/server/rate-limit/check-rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { getWidgetConfig } from "./_services/get-widget-config";

export async function GET(req: NextRequest) {
  const project = await findProjectByPublicId(req.headers.get("x-api-key"));
  if (!project) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAllowedOrigin(req.headers, project.domain)) {
    return NextResponse.json({ error: "Origin not allowed" }, { status: 403 });
  }

  const { allowed } = await checkRateLimit(project.id, "read");
  if (!allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again later." },
      { status: 429 },
    );
  }

  const config = await getWidgetConfig({
    organizationId: project.organizationId,
    widgetConfig: project.widgetConfig,
  });

  return NextResponse.json(config);
}
