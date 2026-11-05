import type { FeedbackStatus } from "@/app/_domains/feedback";

type ListedFeedback = {
  status: FeedbackStatus;
  startMs: number;
  createdAt: string;
};

// Resolved and archived Feedback stays out of the way until asked for.
const HIDDEN_BY_DEFAULT: ReadonlySet<FeedbackStatus> = new Set([
  "resolved",
  "closed",
]);

export function isHiddenByDefault(status: FeedbackStatus) {
  return HIDDEN_BY_DEFAULT.has(status);
}

/**
 * The Feedback the review page lists, chronological by in point (earliest
 * posted first on a tie), and how many the "Show resolved" toggle hides.
 */
export function listVisibleFeedback<T extends ListedFeedback>(
  items: readonly T[],
  showResolved: boolean,
) {
  const sorted = [...items].sort(
    (a, b) => a.startMs - b.startMs || a.createdAt.localeCompare(b.createdAt),
  );
  const hiddenCount = sorted.filter((item) =>
    isHiddenByDefault(item.status),
  ).length;
  const visible = showResolved
    ? sorted
    : sorted.filter((item) => !isHiddenByDefault(item.status));

  return { visible, hiddenCount };
}
