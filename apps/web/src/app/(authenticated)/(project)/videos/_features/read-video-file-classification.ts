import {
  classifyVideoFile,
  getVideoTailLength,
  type VideoFileClassification,
} from "@/app/_domains/video/_helpers/classify-video-file";

// Enough for the `moov` of a long progressive file; a header that does not
// fit is classified as unknown rather than read whole.
const MAX_HEAD_BYTES = 16 * 1024 * 1024;
const MAX_TAIL_BYTES = 64 * 1024 * 1024;

/** Reads the bytes `classifyVideoFile` needs from a file the User picked. */
export async function readVideoFileClassification(
  file: File,
): Promise<VideoFileClassification> {
  try {
    const head = await readBytes(file, 0, Math.min(file.size, MAX_HEAD_BYTES));
    const tailLength = getVideoTailLength({ fileSize: file.size, head });
    const tail =
      tailLength !== null && tailLength <= MAX_TAIL_BYTES
        ? await readBytes(file, file.size - tailLength, file.size)
        : undefined;

    return classifyVideoFile({
      fileName: file.name,
      fileSize: file.size,
      head,
      tail,
    });
  } catch {
    return { kind: "refused", reason: "unknown" };
  }
}

async function readBytes(file: File, start: number, end: number) {
  return new Uint8Array(await file.slice(start, end).arrayBuffer());
}
