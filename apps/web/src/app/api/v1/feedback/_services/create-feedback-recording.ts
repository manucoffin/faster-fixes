import { createAsset } from "@/server/storage/create-asset";
import { putStorageObject } from "@/server/storage/objects";
import crypto from "crypto";

const RECORDING_CONTENT_TYPE = "application/gzip";

type CreateFeedbackRecordingInput = {
  projectId: string;
  /** The gzip file as the Widget sent it, never decompressed here. */
  body: Buffer<ArrayBuffer>;
};

/**
 * Stores a Recording in the bucket, under a folder per Project parallel to the
 * Screenshots', and records the Asset that points at it.
 */
export async function createFeedbackRecording({
  projectId,
  body,
}: CreateFeedbackRecordingInput) {
  const key = `feedback-recordings/${projectId}/${crypto.randomUUID()}.gz`;

  await putStorageObject({ key, body, contentType: RECORDING_CONTENT_TYPE });

  const asset = await createAsset({
    key,
    filename: "recording.gz",
    mimeType: RECORDING_CONTENT_TYPE,
    size: BigInt(body.length),
  });

  return asset.id;
}

export type CreateFeedbackRecordingOutput = Awaited<
  ReturnType<typeof createFeedbackRecording>
>;
