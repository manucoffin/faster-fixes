import { checkRateLimit } from "@/server/api/check-rate-limit";
import { resolveProject } from "@/server/api/resolve-project";
import { validateOrigin } from "@/server/api/validate-origin";
import { validateReviewer } from "@/server/api/validate-reviewer";
import { createAsset } from "@/server/storage/create-asset";
import { buildAssetUrl } from "@/server/storage/build-asset-url";
import { s3Client } from "@/server/storage";
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
});

// POST /api/v1/feedback — submit new feedback (multipart)
export async function POST(req: NextRequest) {
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
    return NextResponse.json({ error: "Invalid JSON in data field" }, { status: 400 });
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
  const screenshotFile = formData.get("screenshot");
  if (screenshotFile instanceof File) {
    try {
      const buffer = Buffer.from(await screenshotFile.arrayBuffer());
      if (buffer.length > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: "Screenshot exceeds 5MB limit" },
          { status: 413 },
        );
      }

      const key = `feedback-screenshots/${project.id}/${crypto.randomUUID()}.png`;
      const bucket = process.env.STORAGE_BUCKET_NAME!;

      await putObject(s3Client, {
        bucket,
        key,
        body: buffer,
        contentType: screenshotFile.type || "image/png",
      });

      const asset = await createAsset({
        key,
        bucket,
        provider: "r2",
        filename: "screenshot.png",
        mimeType: screenshotFile.type || "image/png",
        size: buffer.length,
      });
      screenshotId = asset.id;
    } catch {
      // Screenshot upload failed — proceed without it
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
      screenshotId,
    },
    include: {
      reviewer: { select: { id: true, name: true } },
      screenshot: { select: { key: true, provider: true, bucket: true } },
    },
  });

  return NextResponse.json(
    {
      id: feedback.id,
      status: feedback.status,
      comment: feedback.comment,
      pageUrl: feedback.pageUrl,
      clickX: feedback.clickX,
      clickY: feedback.clickY,
      selector: feedback.selector,
      screenshotUrl: feedback.screenshot
        ? buildAssetUrl(feedback.screenshot)
        : null,
      reviewer: feedback.reviewer,
      createdAt: feedback.createdAt,
    },
    { status: 201 },
  );
}

// GET /api/v1/feedback — fetch feedback for a page
export async function GET(req: NextRequest) {
  const project = await resolveProject(req.headers.get("x-api-key"));
  if (!project) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reviewerToken = req.headers.get("x-reviewer-token");
  const reviewer = await validateReviewer(reviewerToken, project.id);
  if (!reviewer) {
    return NextResponse.json({ error: "Invalid reviewer token" }, { status: 403 });
  }

  const allowed = await checkRateLimit(project.apiKeyHash, "read");
  if (!allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again later." },
      { status: 429 },
    );
  }

  const { searchParams } = req.nextUrl;
  const url = searchParams.get("url");
  if (!url) {
    return NextResponse.json(
      { error: "url query parameter is required" },
      { status: 422 },
    );
  }

  const feedbackList = await prisma.feedback.findMany({
    where: {
      projectId: project.id,
      pageUrl: url,
    },
    orderBy: { createdAt: "desc" },
    include: {
      reviewer: { select: { id: true, name: true } },
      screenshot: { select: { key: true, provider: true, bucket: true } },
    },
  });

  return NextResponse.json({
    feedback: feedbackList.map((f) => ({
      id: f.id,
      status: f.status,
      comment: f.comment,
      pageUrl: f.pageUrl,
      clickX: f.clickX,
      clickY: f.clickY,
      selector: f.selector,
      screenshotUrl: f.screenshot ? buildAssetUrl(f.screenshot) : null,
      reviewer: f.reviewer,
      createdAt: f.createdAt,
    })),
  });
}
