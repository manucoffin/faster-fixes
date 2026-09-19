import { isAllowedOrigin } from "@/app/_domains/project/_helpers/is-allowed-origin";
import { findProjectByPublicId } from "@/app/_domains/project/_services/find-project-by-public-id";
import { findReviewerByToken } from "@/app/_domains/project/_services/find-reviewer-by-token";
import { checkRateLimit } from "@/server/rate-limit/check-rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { createFeedback } from "./_services/create-feedback";
import { CreateFeedbackSchema } from "./_services/create-feedback.schema";
import { createFeedbackScreenshot } from "./_services/create-feedback-screenshot";
import { getFeedbackCapacity } from "./_services/get-feedback-capacity";
import { listFeedbacks } from "./_services/list-feedbacks";

const ALLOWED_SCREENSHOT_TYPES = ["image/png", "image/jpeg", "image/webp"];

// POST /api/v1/feedback — submit new feedback (multipart)
export async function POST(req: NextRequest) {
  console.info(
    "[feedback] POST /api/v1/feedback — content-type:",
    req.headers.get("content-type"),
  );

  const project = await findProjectByPublicId(req.headers.get("x-api-key"));
  if (!project) {
    console.warn("[feedback] unauthorized — invalid API key");
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

  // Checked before the body is read, as it always has been: an Organization at
  // its ceiling is refused without uploading anything.
  const capacity = await getFeedbackCapacity(project.organizationId);
  if (!capacity.allowed) {
    return NextResponse.json(
      {
        error: "Feedback limit reached for this organization's plan.",
        code: "RESOURCE_LIMIT_EXCEEDED",
        current: capacity.current,
        limit: capacity.limit,
      },
      { status: 403 },
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const rawData = formData.get("data");
  if (typeof rawData !== "string") {
    return NextResponse.json({ error: "Missing data field" }, { status: 400 });
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawData);
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON in data field" },
      { status: 400 },
    );
  }

  const parsed = CreateFeedbackSchema.safeParse(parsedJson);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const data = parsed.data;

  // Handle optional screenshot upload
  let screenshotId: string | undefined;
  const screenshotField = formData.get("screenshot");
  console.info(
    "[feedback] screenshot field present:",
    screenshotField !== null,
    "| instanceof File:",
    screenshotField instanceof File,
  );
  if (screenshotField !== null && !(screenshotField instanceof File)) {
    console.warn(
      "[feedback] screenshot field is not a File — type:",
      typeof screenshotField,
      "| value preview:",
      String(screenshotField).slice(0, 100),
    );
  }
  if (screenshotField instanceof File) {
    if (!ALLOWED_SCREENSHOT_TYPES.includes(screenshotField.type)) {
      return NextResponse.json(
        { error: "Invalid screenshot type. Allowed: PNG, JPEG, WebP" },
        { status: 400 },
      );
    }

    console.info(
      "[feedback] screenshot file — name:",
      screenshotField.name,
      "| type:",
      screenshotField.type,
      "| size:",
      screenshotField.size,
    );
    // A storage failure is not a reason to lose the Feedback: the submit goes
    // on without the screenshot, as it always has.
    try {
      const buffer = Buffer.from(await screenshotField.arrayBuffer());
      console.info("[feedback] screenshot buffer length:", buffer.length);
      if (buffer.length > 5 * 1024 * 1024) {
        console.warn("[feedback] screenshot exceeds 5MB limit:", buffer.length);
        return NextResponse.json(
          { error: "Screenshot exceeds 5MB limit" },
          { status: 413 },
        );
      }

      screenshotId = await createFeedbackScreenshot({
        projectId: project.id,
        contentType: screenshotField.type,
        body: buffer,
      });
    } catch (err) {
      console.error("[feedback] screenshot upload failed:", err);
    }
  }

  const feedback = await createFeedback({
    projectId: project.id,
    reviewerId: reviewer.id,
    screenshotId,
    data,
  });

  return NextResponse.json(feedback, { status: 201 });
}

// GET /api/v1/feedback — fetch feedback for a page
export async function GET(req: NextRequest) {
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

  const { allowed } = await checkRateLimit(project.id, "read");
  if (!allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again later." },
      { status: 429 },
    );
  }

  const { searchParams } = req.nextUrl;
  const url = searchParams.get("url");

  const feedback = await listFeedbacks({
    projectId: project.id,
    pageUrl: url ?? undefined,
  });

  return NextResponse.json({ feedback });
}
