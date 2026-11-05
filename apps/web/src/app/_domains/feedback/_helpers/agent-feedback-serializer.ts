import { readVideoSelection, type VideoSelection } from "@/app/_domains/video";
import type { CustomMetadata, DiagnosticTrail } from "@fasterfixes/core";

/**
 * The JSON shape of a Feedback for an agent: one serializer for the agent API
 * listing and the dashboard export, so both surfaces hand out the same keys.
 */

type FeedbackRow = {
  id: string;
  status: string;
  comment: string;
  videoId: string | null;
  pageUrl: string | null;
  startMs: number | null;
  endMs: number | null;
  frameX: number | null;
  frameY: number | null;
  frameWidth: number | null;
  frameHeight: number | null;
  selector: string | null;
  clickX: number | null;
  clickY: number | null;
  viewportWidth: number | null;
  viewportHeight: number | null;
  browserName: string | null;
  browserVersion: string | null;
  os: string | null;
  metadata: unknown;
  diagnosticTrail: unknown;
  customMetadata: unknown;
  reviewer: { name: string };
  createdAt: Date;
};

type AgentFeedbackSelection = VideoSelection & {
  startMs: number;
  /** Null for an instant. */
  endMs: number | null;
};

type VideoRow = {
  id: string;
  title: string;
  filename: string;
  durationMs: number | null;
  width: number | null;
  height: number | null;
};

export function toAgentFeedbackItem(
  f: FeedbackRow,
  screenshotUrl: string | null,
) {
  const isVideoFeedback = f.videoId !== null;

  const selection: AgentFeedbackSelection | null =
    isVideoFeedback && f.startMs !== null
      ? { startMs: f.startMs, endMs: f.endMs, ...readVideoSelection(f) }
      : null;

  return {
    id: f.id,
    status: f.status,
    comment: f.comment,
    videoId: f.videoId,
    pageUrl: f.pageUrl,
    selection,
    selector: f.selector,
    clickX: f.clickX,
    clickY: f.clickY,
    viewportWidth: f.viewportWidth,
    viewportHeight: f.viewportHeight,
    browserName: f.browserName,
    browserVersion: f.browserVersion,
    os: f.os,
    screenshotUrl,
    // The Widget's page context has no counterpart on a video Feedback.
    metadata: isVideoFeedback
      ? null
      : (f.metadata as Record<string, unknown> | null),
    diagnosticTrail: isVideoFeedback
      ? null
      : (f.diagnosticTrail as DiagnosticTrail | null),
    customMetadata: isVideoFeedback
      ? null
      : (f.customMetadata as CustomMetadata | null),
    reviewerName: f.reviewer.name,
    createdAt: f.createdAt,
  };
}

/** What an agent needs to turn normalized coordinates into pixels. */
export function toAgentVideoBlock(video: VideoRow) {
  return {
    id: video.id,
    title: video.title,
    filename: video.filename,
    durationMs: video.durationMs,
    width: video.width,
    height: video.height,
  };
}
