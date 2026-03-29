import { checkRateLimit } from "@/server/api/check-rate-limit";
import { resolveProject } from "@/server/api/resolve-project";
import { validateOrigin } from "@/server/api/validate-origin";
import { validateReviewer } from "@/server/api/validate-reviewer";
import { prisma } from "@workspace/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

type RouteParams = { params: Promise<{ id: string }> };

const UpdateFeedbackSchema = z.object({
  comment: z.string().trim().min(1),
});

// PUT /api/v1/feedback/:id — edit feedback comment
export async function PUT(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const project = await resolveProject(req.headers.get("x-api-key"));
  if (!project) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!validateOrigin(req.headers, project.url)) {
    return NextResponse.json({ error: "Origin not allowed" }, { status: 403 });
  }

  const reviewerToken = req.headers.get("x-reviewer-token");
  const reviewer = await validateReviewer(reviewerToken, project.id);
  if (!reviewer) {
    return NextResponse.json({ error: "Invalid reviewer token" }, { status: 403 });
  }

  const allowed = await checkRateLimit(project.apiKeyHash, "submit");
  if (!allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again later." },
      { status: 429 },
    );
  }

  const feedback = await prisma.feedback.findFirst({
    where: { id, projectId: project.id },
  });

  if (!feedback) {
    return NextResponse.json({ error: "Feedback not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = UpdateFeedbackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const updated = await prisma.feedback.update({
    where: { id },
    data: { comment: parsed.data.comment },
  });

  return NextResponse.json({
    id: updated.id,
    comment: updated.comment,
    updatedAt: updated.updatedAt,
  });
}

// DELETE /api/v1/feedback/:id — delete feedback
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const project = await resolveProject(req.headers.get("x-api-key"));
  if (!project) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!validateOrigin(req.headers, project.url)) {
    return NextResponse.json({ error: "Origin not allowed" }, { status: 403 });
  }

  const reviewerToken = req.headers.get("x-reviewer-token");
  const reviewer = await validateReviewer(reviewerToken, project.id);
  if (!reviewer) {
    return NextResponse.json({ error: "Invalid reviewer token" }, { status: 403 });
  }

  const allowed = await checkRateLimit(project.apiKeyHash, "submit");
  if (!allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again later." },
      { status: 429 },
    );
  }

  const feedback = await prisma.feedback.findFirst({
    where: { id, projectId: project.id },
  });

  if (!feedback) {
    return NextResponse.json({ error: "Feedback not found" }, { status: 404 });
  }

  await prisma.feedback.delete({ where: { id } });

  return new NextResponse(null, { status: 204 });
}
