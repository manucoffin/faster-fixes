const POSTER_WIDTH = 320;
const POSTER_POSITION = 0.1;
const POSTER_QUALITY = 0.8;
// A browser that cannot decode the file may never fire `error`.
const CAPTURE_TIMEOUT_MS = 15_000;

/**
 * Draws the frame at 10% of a local video file to a JPEG 320 px wide.
 * Resolves null on any failure: a missing Poster never blocks the upload.
 */
export async function captureVideoPoster(file: File): Promise<Blob | null> {
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";

  try {
    return await withTimeout(drawPoster(video, url), CAPTURE_TIMEOUT_MS);
  } catch {
    return null;
  } finally {
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(url);
  }
}

async function drawPoster(video: HTMLVideoElement, url: string) {
  const metadataLoaded = waitForEvent(video, "loadedmetadata");
  video.src = url;
  await metadataLoaded;

  const { duration, videoWidth, videoHeight } = video;
  if (!Number.isFinite(duration) || videoWidth === 0 || videoHeight === 0) {
    return null;
  }

  const seeked = waitForEvent(video, "seeked");
  video.currentTime = duration * POSTER_POSITION;
  await seeked;

  const canvas = document.createElement("canvas");
  canvas.width = POSTER_WIDTH;
  canvas.height = Math.max(
    1,
    Math.round((POSTER_WIDTH * videoHeight) / videoWidth),
  );
  const context = canvas.getContext("2d");
  if (!context) {
    return null;
  }
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  return new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", POSTER_QUALITY),
  );
}

function waitForEvent(
  video: HTMLVideoElement,
  type: "loadedmetadata" | "seeked",
) {
  return new Promise<void>((resolve, reject) => {
    video.addEventListener(type, () => resolve(), { once: true });
    video.addEventListener("error", () => reject(video.error), { once: true });
  });
}

function withTimeout<T>(promise: Promise<T>, ms: number) {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}
