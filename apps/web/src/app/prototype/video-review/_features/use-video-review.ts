import { useState } from "react";
import { generateReviewerName } from "../_helpers/generate-reviewer-name";

export type FramePoint = { x: number; y: number };
export type FrameArea = { x: number; y: number; width: number; height: number };

// Mirrors the flat Selection columns decided for a video Feedback: an instant
// or a range, plus an optional point or area normalized to the frame.
export type VideoSelection = {
  startMs: number;
  endMs: number | null;
  point: FramePoint | null;
  area: FrameArea | null;
};

export type FeedbackStatus = "new" | "in_progress" | "resolved";

export type ReviewFeedback = {
  id: string;
  reviewerName: string;
  message: string;
  status: FeedbackStatus;
  selection: VideoSelection;
  screenshot: string | null;
};

export type Draft = { selection: VideoSelection; message: string };

export type NamePrompt = { suggestion: string; error: string | null };

export const VIDEO_TITLE = "Homepage hero cut v3";
export const VIDEO_SRC = "/prototype/video-review-sample.mp4";

const SEED_FEEDBACK: ReviewFeedback[] = [
  {
    id: "seed-1",
    reviewerName: "Curious Otter",
    message: "The logo is cropped on the left here.",
    status: "new",
    selection: {
      startMs: 2000,
      endMs: null,
      point: { x: 0.18, y: 0.22 },
      area: null,
    },
    screenshot: null,
  },
  {
    id: "seed-2",
    reviewerName: "Brave Heron",
    message: "This whole transition drags. Can we cut it to about a second?",
    status: "new",
    selection: {
      startMs: 6500,
      endMs: 9000,
      point: null,
      area: { x: 0.3, y: 0.3, width: 0.4, height: 0.35 },
    },
    screenshot: null,
  },
  {
    id: "seed-3",
    reviewerName: "Curious Otter",
    message: "Music gets loud around here, please duck it under the voice.",
    status: "in_progress",
    selection: { startMs: 13200, endMs: null, point: null, area: null },
    screenshot: null,
  },
  {
    id: "seed-4",
    reviewerName: "Quiet Fox",
    message: "Typo in the lower third: 'recieve'.",
    status: "resolved",
    selection: {
      startMs: 17000,
      endMs: null,
      point: null,
      area: { x: 0.1, y: 0.75, width: 0.5, height: 0.12 },
    },
    screenshot: null,
  },
  {
    id: "seed-5",
    reviewerName: "Brave Heron",
    message: "End card should hold two seconds longer.",
    status: "new",
    selection: {
      startMs: 20500,
      endMs: 23000,
      point: { x: 0.5, y: 0.5 },
      area: null,
    },
    screenshot: null,
  },
];

// Names already claimed on this Video by Reviewers with no Feedback left.
const TAKEN_NAMES = ["Swift Lynx"];

function isNameTaken(name: string, feedbacks: ReviewFeedback[]) {
  const lowered = name.toLowerCase();
  return (
    TAKEN_NAMES.some((taken) => taken.toLowerCase() === lowered) ||
    feedbacks.some(
      (feedback) => feedback.reviewerName.toLowerCase() === lowered,
    )
  );
}

// All review state lives in memory: this prototype checks the interaction
// model, not persistence.
export function useVideoReview() {
  const [feedbacks, setFeedbacks] = useState(SEED_FEEDBACK);
  const [reviewerName, setReviewerName] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [showResolved, setShowResolved] = useState(false);
  const [namePrompt, setNamePrompt] = useState<NamePrompt | null>(null);
  const [pendingScreenshot, setPendingScreenshot] = useState<string | null>(
    null,
  );
  const [activeFeedbackId, setActiveFeedbackId] = useState<string | null>(null);

  const visibleFeedbacks = feedbacks
    .filter((feedback) => showResolved || feedback.status !== "resolved")
    .sort((a, b) => a.selection.startMs - b.selection.startMs);

  const resolvedCount = feedbacks.filter(
    (feedback) => feedback.status === "resolved",
  ).length;

  // Creates the draft at an instant, or moves an existing draft's in point.
  function anchorDraft(startMs: number) {
    setDraft((current) => {
      if (!current) {
        return {
          selection: { startMs, endMs: null, point: null, area: null },
          message: "",
        };
      }
      const endMs =
        current.selection.endMs !== null && current.selection.endMs > startMs
          ? current.selection.endMs
          : null;
      return {
        ...current,
        selection: { ...current.selection, startMs, endMs },
      };
    });
  }

  function updateDraftSelection(patch: Partial<VideoSelection>) {
    setDraft((current) =>
      current
        ? { ...current, selection: { ...current.selection, ...patch } }
        : current,
    );
  }

  function setDraftMessage(message: string) {
    setDraft((current) => (current ? { ...current, message } : current));
  }

  function discardDraft() {
    setDraft(null);
  }

  function commitDraft(
    current: Draft,
    name: string,
    screenshot: string | null,
  ) {
    const id = `fb-${Date.now()}`;
    setFeedbacks((list) => [
      ...list,
      {
        id,
        reviewerName: name,
        message: current.message.trim(),
        status: "new",
        selection: current.selection,
        screenshot,
      },
    ]);
    setActiveFeedbackId(id);
    setDraft(null);
  }

  // The name prompt only appears at the first submit, never on page load.
  function submitDraft(screenshot: string | null) {
    if (!draft || !draft.message.trim()) return;
    if (!reviewerName) {
      setPendingScreenshot(screenshot);
      setNamePrompt({ suggestion: generateReviewerName(), error: null });
      return;
    }
    commitDraft(draft, reviewerName, screenshot);
  }

  function claimName(name: string) {
    const trimmed = name.trim();
    if (!trimmed) {
      setNamePrompt((current) =>
        current ? { ...current, error: "Enter a name." } : current,
      );
      return;
    }
    if (isNameTaken(trimmed, feedbacks)) {
      setNamePrompt((current) =>
        current
          ? { ...current, error: "This name is already taken on this video." }
          : current,
      );
      return;
    }
    setReviewerName(trimmed);
    setNamePrompt(null);
    if (draft) commitDraft(draft, trimmed, pendingScreenshot);
    setPendingScreenshot(null);
  }

  function cancelNamePrompt() {
    setNamePrompt(null);
    setPendingScreenshot(null);
  }

  function canEdit(feedback: ReviewFeedback) {
    return (
      reviewerName !== null &&
      feedback.reviewerName === reviewerName &&
      feedback.status === "new"
    );
  }

  function editFeedback(id: string, message: string) {
    setFeedbacks((list) =>
      list.map((feedback) =>
        feedback.id === id && canEdit(feedback)
          ? { ...feedback, message: message.trim() }
          : feedback,
      ),
    );
  }

  function deleteFeedback(id: string) {
    setFeedbacks((list) =>
      list.filter((feedback) => !(feedback.id === id && canEdit(feedback))),
    );
    setActiveFeedbackId((current) => (current === id ? null : current));
  }

  function forgetReviewer() {
    setReviewerName(null);
  }

  function resetData() {
    setFeedbacks(SEED_FEEDBACK);
    setDraft(null);
    setActiveFeedbackId(null);
  }

  return {
    feedbacks,
    visibleFeedbacks,
    resolvedCount,
    reviewerName,
    draft,
    showResolved,
    setShowResolved,
    namePrompt,
    activeFeedbackId,
    setActiveFeedbackId,
    anchorDraft,
    updateDraftSelection,
    setDraftMessage,
    discardDraft,
    submitDraft,
    claimName,
    cancelNamePrompt,
    canEdit,
    editFeedback,
    deleteFeedback,
    forgetReviewer,
    resetData,
  };
}

export type VideoReviewModel = ReturnType<typeof useVideoReview>;
