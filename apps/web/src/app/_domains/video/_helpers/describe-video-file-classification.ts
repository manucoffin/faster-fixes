import type { VideoFileClassification } from "./classify-video-file";

type VideoFileNotice = {
  // Why the file cannot be uploaded, or null when it can.
  refusal: string | null;
  // Shown under an accepted file; the upload stays allowed.
  warnings: string[];
};

const EXPORT_H264 = "Export it as an MP4 with H.264 video and upload it again.";

const REFUSALS = {
  hevc: `This video uses HEVC (H.265), which does not play in every browser. ${EXPORT_H264}`,
  prores: `This video uses ProRes, which only plays in Safari. ${EXPORT_H264}`,
  webm: `WebM videos are not supported. ${EXPORT_H264}`,
  unknown: "This video could not be read. Upload an MP4 with H.264 video.",
} as const;

export function describeVideoFileClassification(
  classification: VideoFileClassification,
): VideoFileNotice {
  if (classification.kind === "refused") {
    return { refusal: REFUSALS[classification.reason], warnings: [] };
  }

  const warnings: string[] = [];
  if (classification.audio !== "aac") {
    warnings.push("The audio in this video may not play in every browser.");
  }
  if (!classification.hasFastStart) {
    warnings.push(
      "This video will take longer to start playing. Export it with fast start (web optimized) for a better review experience.",
    );
  }
  return { refusal: null, warnings };
}
