import { s3Client } from "@/server/storage";
import { createAsset } from "@/server/storage/create-asset";
import { putObject } from "@better-upload/server/helpers";
import crypto from "crypto";

type CreateFeedbackScreenshotInput = {
  projectId: string;
  /** The image type the widget sent, already checked against the allowed set. */
  contentType: string;
  /** The image bytes, as `Buffer.from` hands them over: a `BodyInit` the S3 client accepts. */
  body: Buffer<ArrayBuffer>;
};

/**
 * Stores a widget screenshot in the bucket and records the Asset that points at
 * it, returning the Asset id the Feedback write hangs the screenshot on. The
 * caller decides what an upload failure means for the submit.
 */
export async function createFeedbackScreenshot({
  projectId,
  contentType,
  body,
}: CreateFeedbackScreenshotInput) {
  const ext = contentType.split("/")[1] || "png";
  const key = `feedback-screenshots/${projectId}/${crypto.randomUUID()}.${ext}`;
  const bucket = process.env.STORAGE_BUCKET_NAME!;
  console.info(
    "[feedback] uploading screenshot, key:",
    key,
    "| bucket:",
    bucket,
  );

  await putObject(s3Client, {
    bucket,
    key,
    body,
    contentType,
  });

  const asset = await createAsset({
    key,
    bucket,
    provider: "r2",
    filename: `screenshot.${ext}`,
    mimeType: contentType,
    size: body.length,
  });

  return asset.id;
}

export type CreateFeedbackScreenshotOutput = Awaited<
  ReturnType<typeof createFeedbackScreenshot>
>;
