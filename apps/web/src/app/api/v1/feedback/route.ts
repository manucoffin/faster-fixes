import { checkRateLimit } from "@/server/api/check-rate-limit";
import { handlePreflight, withCors } from "@/server/api/cors";
import { resolveProject } from "@/server/api/resolve-project";
import { validateOrigin } from "@/server/api/validate-origin";
import { validateReviewer } from "@/server/api/validate-reviewer";
import { checkResourceLimit } from "@/server/auth/subscription";
import { inngest } from "@/server/inngest";
import { s3Client } from "@/server/storage";
import { createAsset } from "@/server/storage/create-asset";
import { getSignedAssetUrl } from "@/server/storage/get-signed-asset-url";
import { putObject } from "@better-upload/server/helpers";
import { prisma } from "@workspace/db";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const CreateFeedbackSchema = z.object({
  comment: z.string().trim().min(1),
  pageUrl: z.string().url(),
  selector: z.string().optional(),
  clickX: z.number().optional(),
  clickY: z.number().optional(),
  browserName: z.string().optional(),
  browserVersion: z.string().optional(),
  os: z.string().optional(),
  viewportWidth: z.number().int().optional(),
  viewportHeight: z.number().int().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

const ALLOWED_SCREENSHOT_TYPES = ["image/png", "image/jpeg", "image/webp"];

export async function OPTIONS(req: NextRequest) {
  return handlePreflight(req) ?? new NextResponse(null, { status: 204 });
}

// POST /api/v1/feedback — submit new feedback (multipart)
export async function POST(req: NextRequest) {
  console.info(
    "[feedback] POST /api/v1/feedback — content-type:",
    req.headers.get("content-type"),
  );

  const project = await resolveProject(req.headers.get("x-api-key"));
  if (!project) {
    console.warn("[feedback] unauthorized — invalid API key");
    return withCors(
      req,
      NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    );
  }

  if (!validateOrigin(req.headers, project.url)) {
    return withCors(
      req,
      NextResponse.json({ error: "Origin not allowed" }, { status: 403 }),
    );
  }

  const reviewerToken = req.headers.get("x-reviewer-token");
  const reviewer = await validateReviewer(reviewerToken, project.id);
  if (!reviewer) {
    return withCors(
      req,
      NextResponse.json({ error: "Invalid reviewer token" }, { status: 403 }),
    );
  }

  const allowed = await checkRateLimit(project.apiKeyHash, "submit");
  if (!allowed) {
    return withCors(
      req,
      NextResponse.json(
        { error: "Rate limit exceeded. Try again later." },
        { status: 429 },
      ),
    );
  }

  const feedbackCheck = await checkResourceLimit(
    project.organizationId,
    "feedbacks",
    prisma,
  );
  if (!feedbackCheck.allowed) {
    const { metadata } = feedbackCheck.denial;
    return withCors(
      req,
      NextResponse.json(
        {
          error: "Feedback limit reached for this organization's plan.",
          code: "RESOURCE_LIMIT_EXCEEDED",
          current: metadata.current,
          limit: metadata.limit,
        },
        { status: 403 },
      ),
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return withCors(
      req,
      NextResponse.json({ error: "Invalid form data" }, { status: 400 }),
    );
  }

  const rawData = formData.get("data");
  if (typeof rawData !== "string") {
    return withCors(
      req,
      NextResponse.json({ error: "Missing data field" }, { status: 400 }),
    );
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawData);
  } catch {
    return withCors(
      req,
      NextResponse.json(
        { error: "Invalid JSON in data field" },
        { status: 400 },
      ),
    );
  }

  const parsed = CreateFeedbackSchema.safeParse(parsedJson);
  if (!parsed.success) {
    return withCors(
      req,
      NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 422 },
      ),
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
      return withCors(
        req,
        NextResponse.json(
          { error: "Invalid screenshot type. Allowed: PNG, JPEG, WebP" },
          { status: 400 },
        ),
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
    try {
      const buffer = Buffer.from(await screenshotField.arrayBuffer());
      console.info("[feedback] screenshot buffer length:", buffer.length);
      if (buffer.length > 5 * 1024 * 1024) {
        console.warn("[feedback] screenshot exceeds 5MB limit:", buffer.length);
        return withCors(
          req,
          NextResponse.json(
            { error: "Screenshot exceeds 5MB limit" },
            { status: 413 },
          ),
        );
      }

      const ext = screenshotField.type.split("/")[1] || "png";
      const key = `feedback-screenshots/${project.id}/${crypto.randomUUID()}.${ext}`;
      const bucket = process.env.STORAGE_BUCKET_NAME!;
      console.info(
        "[feedback] uploading screenshot — key:",
        key,
        "| bucket:",
        bucket,
      );

      await putObject(s3Client, {
        bucket,
        key,
        body: buffer,
        contentType: screenshotField.type,
      });
      console.info("[feedback] screenshot uploaded to R2 successfully");

      const asset = await createAsset({
        key,
        bucket,
        provider: "r2",
        filename: `screenshot.${ext}`,
        mimeType: screenshotField.type,
        size: buffer.length,
      });
      screenshotId = asset.id;
      console.info("[feedback] asset record created — id:", asset.id);
    } catch (err) {
      console.error("[feedback] screenshot upload failed:", err);
    }
  }

  const feedback = await prisma.feedback.create({
    data: {
      projectId: project.id,
      reviewerId: reviewer.id,
      comment: data.comment,
      pageUrl: data.pageUrl,
      clickX: data.clickX,
      clickY: data.clickY,
      selector: data.selector,
      browserName: data.browserName,
      browserVersion: data.browserVersion,
      os: data.os,
      viewportWidth: data.viewportWidth,
      viewportHeight: data.viewportHeight,
      metadata: data.metadata,
      screenshotId,
    },
    include: {
      reviewer: { select: { id: true, name: true } },
      screenshot: { select: { key: true, provider: true, bucket: true } },
    },
  });

  console.info(
    "[feedback] created — id:",
    feedback.id,
    "| screenshotId:",
    screenshotId ?? "none",
  );

  // Fire-and-forget: trigger GitHub issue creation if configured
  inngest
    .send({ name: "feedback/created", data: { feedbackId: feedback.id } })
    .catch(() => {});

  return withCors(
    req,
    NextResponse.json(
      {
        id: feedback.id,
        status: feedback.status,
        comment: feedback.comment,
        pageUrl: feedback.pageUrl,
        clickX: feedback.clickX,
        clickY: feedback.clickY,
        selector: feedback.selector,
        screenshotUrl: feedback.screenshot
          ? await getSignedAssetUrl(feedback.screenshot)
          : null,
        metadata: feedback.metadata,
        reviewer: feedback.reviewer,
        createdAt: feedback.createdAt,
      },
      { status: 201 },
    ),
  );
}

// GET /api/v1/feedback — fetch feedback for a page
export async function GET(req: NextRequest) {
  const project = await resolveProject(req.headers.get("x-api-key"));
  if (!project) {
    return withCors(
      req,
      NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    );
  }

  if (!validateOrigin(req.headers, project.url)) {
    return withCors(
      req,
      NextResponse.json({ error: "Origin not allowed" }, { status: 403 }),
    );
  }

  const reviewerToken = req.headers.get("x-reviewer-token");
  const reviewer = await validateReviewer(reviewerToken, project.id);
  if (!reviewer) {
    return withCors(
      req,
      NextResponse.json({ error: "Invalid reviewer token" }, { status: 403 }),
    );
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

  const { searchParams } = req.nextUrl;
  const url = searchParams.get("url");

  const feedbackList = await prisma.feedback.findMany({
    where: {
      projectId: project.id,
      ...(url ? { pageUrl: url } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      reviewer: { select: { id: true, name: true } },
      screenshot: { select: { key: true, provider: true, bucket: true } },
    },
  });

  const feedback = await Promise.all(
    feedbackList.map(async (f) => ({
      id: f.id,
      status: f.status,
      comment: f.comment,
      pageUrl: f.pageUrl,
      clickX: f.clickX,
      clickY: f.clickY,
      selector: f.selector,
      screenshotUrl: f.screenshot
        ? await getSignedAssetUrl(f.screenshot)
        : null,
      metadata: f.metadata,
      reviewer: f.reviewer,
      createdAt: f.createdAt,
    })),
  );

  return withCors(req, NextResponse.json({ feedback }));
}
