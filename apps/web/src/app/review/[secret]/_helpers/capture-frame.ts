// The review API refuses a larger Screenshot; past it the Feedback is posted
// without one rather than failing.
const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024;
const JPEG_QUALITY = 0.85;

type FrameSource = CanvasImageSource & {
  videoWidth: number;
  videoHeight: number;
};

type CanvasLike = Pick<HTMLCanvasElement, "width" | "height" | "toBlob"> & {
  getContext: (
    kind: "2d",
  ) => Pick<CanvasRenderingContext2D, "drawImage"> | null;
};

/**
 * The frame on screen as a JPEG at the Video's natural size, or null when it
 * cannot be had: no frame decoded yet, or a canvas tainted by a storage origin
 * that does not answer CORS. A Screenshot is best-effort.
 */
export async function captureFrame(
  video: FrameSource,
  createCanvas: () => CanvasLike = () => document.createElement("canvas"),
): Promise<Blob | null> {
  if (!video.videoWidth || !video.videoHeight) return null;

  try {
    const canvas = createCanvas();
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // `toBlob` throws a SecurityError on a tainted canvas.
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
    );
    return blob && blob.size <= MAX_SCREENSHOT_BYTES ? blob : null;
  } catch {
    return null;
  }
}
