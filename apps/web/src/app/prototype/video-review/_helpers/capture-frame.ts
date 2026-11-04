const CAPTURE_WIDTH = 640;

// Draws the frame under the playhead into a canvas and returns a JPEG data
// URL, the prototype's stand-in for the Screenshot stored on a video Feedback.
export function captureFrame(video: HTMLVideoElement): string | null {
  if (!video.videoWidth || !video.videoHeight) return null;
  const scale = Math.min(1, CAPTURE_WIDTH / video.videoWidth);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(video.videoWidth * scale);
  canvas.height = Math.round(video.videoHeight * scale);
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  try {
    return canvas.toDataURL("image/jpeg", 0.8);
  } catch {
    // A video served without CORS headers taints the canvas.
    return null;
  }
}
