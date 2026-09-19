import { isAllowedOrigin } from "@/app/_domains/project/_helpers/is-allowed-origin";
import { findProjectByPublicId } from "@/app/_domains/project/_services/find-project-by-public-id";
import { resolveOrganizationPlan } from "@/server/auth/subscription/resolve-organization-plan";
import { checkRateLimit } from "@/server/rate-limit/check-rate-limit";
import { prisma } from "@workspace/db";
import { NextRequest, NextResponse } from "next/server";

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

  const config = project.widgetConfig;
  const plan = await resolveOrganizationPlan(project.organizationId, prisma);

  return NextResponse.json({
    enabled: config?.enabled ?? true,
    branding: !plan.limits.whiteLabel,
  });
}
