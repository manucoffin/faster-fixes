import { Archive, CircleCheck, CircleDashed, CircleDot } from "lucide-react";

// Colour is reserved for status, so the rest of the board stays neutral.
const FEEDBACK_STATUS_APPEARANCE = {
  new: {
    icon: CircleDot,
    iconClassName: "text-blue-500",
    swatchClassName: "bg-blue-500",
    pillClassName:
      "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  },
  in_progress: {
    icon: CircleDashed,
    iconClassName: "text-amber-500",
    swatchClassName: "bg-amber-500",
    pillClassName:
      "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  resolved: {
    icon: CircleCheck,
    iconClassName: "text-success",
    swatchClassName: "bg-success",
    pillClassName: "border-success/30 bg-success/10 text-success",
  },
  // Not a board column, but an archived Feedback can still be shown.
  closed: {
    icon: Archive,
    iconClassName: "text-muted-foreground",
    swatchClassName: "bg-muted-foreground",
    pillClassName: "border-border bg-muted text-muted-foreground",
  },
} as const;

export function getFeedbackStatusAppearance(status: string) {
  return status in FEEDBACK_STATUS_APPEARANCE
    ? FEEDBACK_STATUS_APPEARANCE[
        status as keyof typeof FEEDBACK_STATUS_APPEARANCE
      ]
    : FEEDBACK_STATUS_APPEARANCE.new;
}
