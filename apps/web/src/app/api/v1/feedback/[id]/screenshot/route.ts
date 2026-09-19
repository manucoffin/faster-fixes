/**
 * The widget API's HTTP boundary for a Feedback screenshot: Project resolution,
 * the Allowed origins match, the Reviewer token, the rate limit, the multipart
 * parse and the `DomainError` mapping live here, so the `_services/` functions
 * below stay transport-agnostic.
 */

import { isAllowedOrigin } from "@/app/_domains/project/_helpers/is-allowed-origin";
import { findProjectByPublicId } from "@/app/_domains/project/_services/find-project-by-public-id";
import { findReviewerByToken } from "@/app/_domains/project/_services/find-reviewer-by-token";
import { checkRateLimit } from "@/server/rate-limit/check-rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { widgetErrorResponse } from "../../_helpers/widget-error-response";
import { createFeedbackScreenshot } from "../../_services/create-feedback-screenshot";
import { getFeedbackAwaitingScreenshot } from "../../_services/get-feedback-awaiting-screenshot";
import { updateFeedbackScreenshot } from "../../_services/update-feedback-screenshot";

type RouteParams = { params: Promise<{ id: string }> };

const ALLOWED_SCREENSHOT_TYPES = ["image/png", "image/jpeg", "image/webp"];

// PUT /api/v1/feedback/:id/screenshot — attach screenshot after creation
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
    // Existence and the overwrite refusal both come before the body is read, as
    // they always have: an unknown Feedback with a broken payload answers 404,
    // not 400.
    await getFeedbackAwaitingScreenshot({
      feedbackId: id,
      projectId: project.id,
    });

    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
    }

    const screenshotField = formData.get("screenshot");
    if (!(screenshotField instanceof File)) {
      return NextResponse.json(
        { error: "Missing screenshot file" },
        { status: 400 },
      );
    }

    if (!ALLOWED_SCREENSHOT_TYPES.includes(screenshotField.type)) {
      return NextResponse.json(
        { error: "Invalid screenshot type. Allowed: PNG, JPEG, WebP" },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await screenshotField.arrayBuffer());
    if (buffer.length > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Screenshot exceeds 5MB limit" },
        { status: 413 },
      );
    }

    const screenshotId = await createFeedbackScreenshot({
      projectId: project.id,
      contentType: screenshotField.type,
      body: buffer,
    });

    const attached = await updateFeedbackScreenshot({
      feedbackId: id,
      screenshotId,
    });

    return NextResponse.json(attached);
  } catch (error) {
    const response = widgetErrorResponse(error);
    if (!response) throw error;
    return response;
  }
}
