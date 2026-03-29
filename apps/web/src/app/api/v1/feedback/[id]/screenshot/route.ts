import { checkRateLimit } from "@/server/api/check-rate-limit";
import { resolveProject } from "@/server/api/resolve-project";
import { validateOrigin } from "@/server/api/validate-origin";
import { validateReviewer } from "@/server/api/validate-reviewer";
import { s3Client } from "@/server/storage";
import { createAsset } from "@/server/storage/create-asset";
import { getSignedAssetUrl } from "@/server/storage/get-signed-asset-url";
import { putObject } from "@better-upload/server/helpers";
import { prisma } from "@workspace/db";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

type RouteParams = { params: Promise<{ id: string }> };

const ALLOWED_SCREENSHOT_TYPES = ["image/png", "image/jpeg", "image/webp"];

// PUT /api/v1/feedback/:id/screenshot — attach screenshot after creation
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
    return NextResponse.json(
      { error: "Invalid reviewer token" },
      { status: 403 },
    );
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

  // Don't overwrite an existing screenshot
  if (feedback.screenshotId) {
    return NextResponse.json(
      { error: "Screenshot already attached" },
      { status: 409 },
    );
  }

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

  const ext = screenshotField.type.split("/")[1] || "png";
  const key = `feedback-screenshots/${project.id}/${crypto.randomUUID()}.${ext}`;
  const bucket = process.env.STORAGE_BUCKET_NAME!;

  await putObject(s3Client, {
    bucket,
    key,
    body: buffer,
    contentType: screenshotField.type,
  });

  const asset = await createAsset({
    key,
    bucket,
    provider: "r2",
    filename: `screenshot.${ext}`,
    mimeType: screenshotField.type,
    size: buffer.length,
  });

  const updated = await prisma.feedback.update({
    where: { id },
    data: { screenshotId: asset.id },
    include: {
      screenshot: { select: { key: true, provider: true, bucket: true } },
    },
  });

  const screenshotUrl = updated.screenshot
    ? await getSignedAssetUrl(updated.screenshot)
    : null;

  return NextResponse.json({ screenshotUrl });
}
