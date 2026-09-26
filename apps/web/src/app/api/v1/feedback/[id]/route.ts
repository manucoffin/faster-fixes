/**
 * The widget API's HTTP boundary for one Feedback: Project resolution, the
 * Allowed origins match, the Reviewer token, the rate limit, the body parse and
 * the `DomainError` mapping live here, so the `_services/` functions below stay
 * transport-agnostic.
 */

import { isAllowedOrigin } from "@/app/_domains/project/_helpers/is-allowed-origin";
import { findProjectByPublicId } from "@/app/_domains/project/_services/find-project-by-public-id";
import { findReviewerByToken } from "@/app/_domains/project/_services/find-reviewer-by-token";
import { checkRateLimit } from "@/server/rate-limit/check-rate-limit";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { widgetErrorResponse } from "../_helpers/widget-error-response";
import { deleteFeedback } from "../_services/delete-feedback";
import { getProjectFeedback } from "../_services/get-project-feedback";
import { updateFeedbackComment } from "../_services/update-feedback-comment";

type RouteParams = { params: Promise<{ id: string }> };

const UpdateFeedbackSchema = z.object({
  comment: z.string().trim().min(1),
});

// PUT /api/v1/feedback/:id — edit feedback comment
export async function PUT(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const project = await findProjectByPublicId(req.headers.get("x-api-key"));
  if (!project) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAllowedOrigin(req.headers, project.domain)) {
    return NextResponse.json({ error: "Origin not allowed" }, { status: 403 });
  }

  const reviewerToken = req.headers.get("x-reviewer-token");
  const reviewer = await findReviewerByToken(reviewerToken, project.id);
  if (!reviewer) {
    return NextResponse.json(
      { error: "Invalid reviewer token" },
      { status: 403 },
    );
  }

  const { allowed } = await checkRateLimit(project.id, "submit");
  if (!allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again later." },
      { status: 429 },
    );
  }

  try {
    // Existence comes before the body is read, as it always has: an unknown
    // Feedback with a broken payload answers 404, not 400.
    await getProjectFeedback({ feedbackId: id, projectId: project.id });

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = UpdateFeedbackSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: z.flattenError(parsed.error) },
        { status: 422 },
      );
    }

    const updated = await updateFeedbackComment({
      feedbackId: id,
      comment: parsed.data.comment,
    });

    return NextResponse.json(updated);
  } catch (error) {
    const response = widgetErrorResponse(error);
    if (!response) throw error;
    return response;
  }
}

// DELETE /api/v1/feedback/:id — delete feedback
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const project = await findProjectByPublicId(req.headers.get("x-api-key"));
  if (!project) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAllowedOrigin(req.headers, project.domain)) {
    return NextResponse.json({ error: "Origin not allowed" }, { status: 403 });
  }

  const reviewerToken = req.headers.get("x-reviewer-token");
  const reviewer = await findReviewerByToken(reviewerToken, project.id);
  if (!reviewer) {
    return NextResponse.json(
      { error: "Invalid reviewer token" },
      { status: 403 },
    );
  }

  const { allowed } = await checkRateLimit(project.id, "submit");
  if (!allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again later." },
      { status: 429 },
    );
  }

  try {
    await getProjectFeedback({ feedbackId: id, projectId: project.id });
    await deleteFeedback({ feedbackId: id });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const response = widgetErrorResponse(error);
    if (!response) throw error;
    return response;
  }
}
