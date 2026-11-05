import { cn } from "@workspace/ui/lib/utils";
import { FeedbackStatusEnum } from "../_helpers/feedback-status";
import { getFeedbackStatusLabel } from "../_helpers/feedback-status-label";
import { getFeedbackStatusAppearance } from "./feedback-status-appearance";

type FeedbackStatusPillProps = {
  status: string;
  className?: string;
};

export function FeedbackStatusPill({
  status,
  className,
}: FeedbackStatusPillProps) {
  const appearance = getFeedbackStatusAppearance(status);
  const StatusIcon = appearance.icon;
  const parsed = FeedbackStatusEnum.safeParse(status);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-medium",
        appearance.pillClassName,
        className,
      )}
    >
      <StatusIcon className="size-3" />
      {parsed.success ? getFeedbackStatusLabel(parsed.data) : status}
    </span>
  );
}
