import { createAsset } from "@/server/storage/create-asset";
import { s3Client } from "@/server/storage";
import { putObject } from "@better-upload/server/helpers";
import { prisma } from "@workspace/db";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;

async function checkRateLimit(reviewerToken: string): Promise<boolean> {
  const key = `feedback:reviewer:${reviewerToken}`;
  const now = Date.now();

  const record = await prisma.rateLimit.upsert({
    where: { key },
    update: {},
    create: { id: crypto.randomUUID(), key, count: 0, lastRequest: BigInt(now) },
  });

  const windowStart = now - RATE_LIMIT_WINDOW_MS;

  if (Number(record.lastRequest) < windowStart) {
    await prisma.rateLimit.update({
      where: { key },
      data: { count: 1, lastRequest: BigInt(now) },
    });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }

  await prisma.rateLimit.update({
    where: { key },
    data: { count: { increment: 1 }, lastRequest: BigInt(now) },
  });

  return true;
}

async function resolveProject(authHeader: string | null) {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const rawKey = authHeader.slice(7);
  const hash = crypto.createHash("sha256").update(rawKey).digest("hex");
  return prisma.project.findFirst({ where: { apiKeyHash: hash } });
}

// POST /api/feedback — submit new feedback
export async function POST(req: NextRequest) {
  const project = await resolveProject(req.headers.get("authorization"));
  if (!project) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const schema = z.object({
    reviewerToken: z.string().min(1),
    comment: z.string().trim().min(1),
    pageUrl: z.string().url(),
    clickX: z.number().optional(),
    clickY: z.number().optional(),
    selector: z.string().optional(),
    browserName: z.string().optional(),
    browserVersion: z.string().optional(),
    os: z.string().optional(),
    viewportWidth: z.number().int().optional(),
    viewportHeight: z.number().int().optional(),
    metadata: z.record(z.string(), z.any()).optional(),
    screenshot: z.string().optional(), // base64 encoded image
  });

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const data = parsed.data;

  const reviewer = await prisma.reviewer.findFirst({
    where: { token: data.reviewerToken, projectId: project.id, isActive: true },
  });

  if (!reviewer) {
    return NextResponse.json(
      { error: "Reviewer token invalid or inactive" },
      { status: 403 },
    );
  }

  const allowed = await checkRateLimit(data.reviewerToken);
  if (!allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again later." },
      { status: 429 },
    );
  }

  let screenshotId: string | undefined;
  if (data.screenshot) {
    try {
      const buffer = Buffer.from(data.screenshot, "base64");
      const key = `feedback-screenshots/${project.id}/${crypto.randomUUID()}.png`;
      const bucket = process.env.STORAGE_BUCKET_NAME!;

      await putObject(s3Client, {
        bucket,
        key,
        body: buffer,
        contentType: "image/png",
      });

      const asset = await createAsset({
        key,
        bucket,
        provider: "r2",
        filename: "screenshot.png",
        mimeType: "image/png",
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
      metadata: data.metadata,
      screenshotId,
    },
  });

  return NextResponse.json({ id: feedback.id }, { status: 201 });
}

// GET /api/feedback — retrieve feedback pins for the widget
export async function GET(req: NextRequest) {
  const project = await resolveProject(req.headers.get("authorization"));
  if (!project) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const reviewerToken = searchParams.get("reviewerToken");
  const pageUrl = searchParams.get("pageUrl") ?? undefined;
  const statusParam = searchParams.get("status") ?? "new";

  if (!reviewerToken) {
    return NextResponse.json(
      { error: "reviewerToken query param is required" },
      { status: 422 },
    );
  }

  const reviewer = await prisma.reviewer.findFirst({
    where: { token: reviewerToken, projectId: project.id, isActive: true },
  });

  if (!reviewer) {
    return NextResponse.json(
      { error: "Reviewer token invalid or inactive" },
      { status: 403 },
    );
  }

  const feedback = await prisma.feedback.findMany({
    where: {
      projectId: project.id,
      ...(pageUrl ? { pageUrl } : {}),
      status: statusParam,
    },
    orderBy: { createdAt: "desc" },
    include: { reviewer: { select: { name: true } } },
  });

  return NextResponse.json(
    feedback.map((f) => ({
      id: f.id,
      comment: f.comment,
      clickX: f.clickX,
      clickY: f.clickY,
      selector: f.selector,
      status: f.status,
      reviewerName: f.reviewer.name,
      createdAt: f.createdAt,
    })),
  );
}
